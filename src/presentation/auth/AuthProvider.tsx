import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Usuario } from '@/domain/entities/Usuario'
import type { DadosDeLogin } from '@/application/useCases/AutenticarUsuarioUseCase'
import type { DadosDeNovaConta } from '@/application/useCases/CriarContaUseCase'
import type { ServicosDeAutenticacao } from '@/composition/servicosDeAutenticacao'
import { AuthContext, type Sessao } from './AuthContext'

interface AuthProviderProps {
  servicos: ServicosDeAutenticacao
  children: ReactNode
}

const FALHA_AO_CARREGAR_PERFIL =
  'Não foi possível carregar seu perfil de acesso. Tente entrar novamente.'

/**
 * Mantém a sessão viva enquanto o app roda: observa o provedor de autenticação,
 * resolve o perfil (com papel) uma única vez por login e disponibiliza as ações
 * de entrar/criar conta/sair.
 */
export function AuthProvider({ servicos, children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erroDeSessao, setErroDeSessao] = useState<string | null>(null)

  // Espelho do estado para o observador saber, sem virar dependência do efeito,
  // se o perfil do uid que chegou já está em memória.
  const usuarioEmCache = useRef<Usuario | null>(null)

  const guardar = useCallback((perfil: Usuario | null) => {
    usuarioEmCache.current = perfil
    setUsuario(perfil)
  }, [])

  useEffect(() => {
    let ativo = true

    const cancelarObservacao = servicos.provedor.observarSessao(
      async (credencial) => {
        if (credencial === null) {
          if (ativo) {
            guardar(null)
            setCarregando(false)
          }
          return
        }

        const jaCacheado = usuarioEmCache.current?.id === credencial.uid
        if (jaCacheado) {
          if (ativo) setCarregando(false)
          return
        }

        try {
          const perfil = await servicos.garantirPerfil.executar(credencial)
          if (!ativo) return
          guardar(perfil)
          setErroDeSessao(null)
        } catch {
          if (!ativo) return
          guardar(null)
          setErroDeSessao(FALHA_AO_CARREGAR_PERFIL)
        } finally {
          if (ativo) setCarregando(false)
        }
      },
    )

    return () => {
      ativo = false
      cancelarObservacao()
    }
  }, [servicos, guardar])

  const entrar = useCallback(
    async (dados: DadosDeLogin) => {
      setErroDeSessao(null)
      guardar(await servicos.autenticarUsuario.executar(dados))
      setCarregando(false)
    },
    [servicos, guardar],
  )

  const criarConta = useCallback(
    async (dados: DadosDeNovaConta) => {
      setErroDeSessao(null)
      guardar(await servicos.criarConta.executar(dados))
      setCarregando(false)
    },
    [servicos, guardar],
  )

  const sair = useCallback(async () => {
    await servicos.provedor.sair()
    guardar(null)
  }, [servicos, guardar])

  const sessao = useMemo<Sessao>(
    () => ({ usuario, carregando, erroDeSessao, entrar, criarConta, sair }),
    [usuario, carregando, erroDeSessao, entrar, criarConta, sair],
  )

  return <AuthContext.Provider value={sessao}>{children}</AuthContext.Provider>
}
