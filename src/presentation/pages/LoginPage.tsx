import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/presentation/hooks/useAuth'
import { CampoDeTexto } from '@/presentation/components/CampoDeTexto'
import { mensagemDeErro } from '@/presentation/erros'

type Modo = 'entrar' | 'criar-conta'

interface EstadoDeOrigem {
  de?: string
}

export function LoginPage() {
  const { usuario, entrar, criarConta, erroDeSessao } = useAuth()
  const localizacao = useLocation()

  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario !== null) {
    const origem = (localizacao.state as EstadoDeOrigem | null)?.de ?? '/'
    return <Navigate to={origem} replace />
  }

  const criandoConta = modo === 'criar-conta'

  async function submeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      if (criandoConta) {
        await criarConta({ nome, email, senha })
      } else {
        await entrar({ email, senha })
      }
    } catch (falha) {
      setErro(mensagemDeErro(falha))
    } finally {
      setEnviando(false)
    }
  }

  function alternarModo() {
    setModo(criandoConta ? 'entrar' : 'criar-conta')
    setErro(null)
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={submeter}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-6 shadow-md"
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-marinho">
            Controle de Instruções
          </h1>
          <p className="text-sm text-pedra">
            {criandoConta
              ? 'Crie sua conta. O acesso inicial é de leitura; o Admin libera o resto.'
              : 'Entre com seu e-mail e senha.'}
          </p>
        </header>

        {criandoConta && (
          <CampoDeTexto
            id="nome"
            rotulo="Nome"
            valor={nome}
            aoMudar={setNome}
            autoComplete="name"
          />
        )}

        <CampoDeTexto
          id="email"
          rotulo="E-mail"
          tipo="email"
          valor={email}
          aoMudar={setEmail}
          autoComplete="email"
        />

        <CampoDeTexto
          id="senha"
          rotulo="Senha"
          tipo="password"
          valor={senha}
          aoMudar={setSenha}
          autoComplete={criandoConta ? 'new-password' : 'current-password'}
        />

        {(erro ?? erroDeSessao) !== null && (
          <p role="alert" className="text-sm text-red-700">
            {erro ?? erroDeSessao}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-marinho px-4 py-2 font-medium text-marfim disabled:opacity-60"
        >
          {criandoConta ? 'Criar conta' : 'Entrar'}
        </button>

        <button
          type="button"
          onClick={alternarModo}
          className="text-sm text-pedra underline underline-offset-2"
        >
          {criandoConta
            ? 'Já tenho conta — entrar'
            : 'Não tenho conta — criar agora'}
        </button>
      </form>
    </main>
  )
}
