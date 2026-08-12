import { describe, expect, it } from 'vitest'
import { lerEnderecosDosEmuladores } from './emuladores'

describe('lerEnderecosDosEmuladores', () => {
  it('cai no host e nas portas locais quando nada é configurado', () => {
    const enderecos = lerEnderecosDosEmuladores({})

    expect(enderecos).toEqual({
      host: '127.0.0.1',
      portaDoFirestore: 8080,
      portaDoAuth: 9099,
    })
  })

  it('usa o host e as portas configurados', () => {
    const enderecos = lerEnderecosDosEmuladores({
      VITE_FIREBASE_EMULATOR_HOST: 'servidor.local',
      VITE_FIRESTORE_EMULATOR_PORT: '18080',
      VITE_AUTH_EMULATOR_PORT: '19099',
    })

    expect(enderecos).toEqual({
      host: 'servidor.local',
      portaDoFirestore: 18080,
      portaDoAuth: 19099,
    })
  })

  it('ignora variável vazia, tratando-a como ausente', () => {
    const enderecos = lerEnderecosDosEmuladores({
      VITE_FIREBASE_EMULATOR_HOST: '',
      VITE_FIRESTORE_EMULATOR_PORT: '',
    })

    expect(enderecos.host).toBe('127.0.0.1')
    expect(enderecos.portaDoFirestore).toBe(8080)
  })

  it('recusa porta não numérica, dizendo qual variável está errada', () => {
    const lerComPortaInvalida = () =>
      lerEnderecosDosEmuladores({ VITE_AUTH_EMULATOR_PORT: 'oitenta' })

    expect(lerComPortaInvalida).toThrow(/VITE_AUTH_EMULATOR_PORT/)
  })

  it('recusa porta fora do intervalo válido', () => {
    const lerComPortaAlemDoLimite = () =>
      lerEnderecosDosEmuladores({ VITE_FIRESTORE_EMULATOR_PORT: '70000' })

    expect(lerComPortaAlemDoLimite).toThrow(/entre 1 e 65535/)
  })
})
