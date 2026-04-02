import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, RefreshCw } from 'lucide-react'
import { iaApi } from '@/api/ia'
import { patrimonioApi } from '@/api'

interface Mensaje {
  rol: 'usuario' | 'asistente'
  texto: string
}

const SALUDO = '¡Hola! Soy el asistente de Patrimonio Cultural Junín 🏛️\n\nPuedo ayudarte a:\n• Buscar bienes culturales\n• Conocer sitios arqueológicos\n• Información sobre danzas y tradiciones\n• Explorar el patrimonio de Junín\n\n¿En qué puedo ayudarte?'

export default function Chatbot() {
  const [abierto, setAbierto]   = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: 'asistente', texto: SALUDO }
  ])
  const [input, setInput]       = useState('')
  const [cargando, setCargando] = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviar = async () => {
    if (!input.trim() || cargando) return

    const pregunta = input.trim()
    setInput('')
    setMensajes(m => [...m, { rol: 'usuario', texto: pregunta }])
    setCargando(true)

    try {
      // Primero intenta búsqueda semántica
      const res = await iaApi.similar(pregunta, 3)
      const resultados = res.data?.resultados ?? []

      let respuesta = ''

      if (resultados.length > 0) {
        respuesta = `Encontré estos bienes culturales relacionados:\n\n`
        resultados.forEach((b: any, i: number) => {
          const tipo = typeof b.tipo === 'object' ? b.tipo.label : b.tipo
          respuesta += `${i + 1}. **${b.nombre}** (${tipo})\n`
          respuesta += `   📍 ${b.region_geografica}\n`
          respuesta += `   ${b.descripcion?.slice(0, 120)}...\n\n`
        })
        respuesta += `¿Te gustaría saber más sobre alguno de estos bienes?`
      } else {
        // Si no hay resultados, usa Groq para responder conversacionalmente
        const groqRes = await iaApi.generarDescripcion({
          nombre: pregunta,
          tipo: 'consulta',
          region_geografica: 'Junín, Perú',
          periodo_historico: 'general',
          contexto: `El usuario pregunta: "${pregunta}". Responde como asistente de patrimonio cultural de Junín, Perú. Sé amigable y conciso.`
        })
        const groqData = groqRes.data?.data ?? groqRes.data
        respuesta = groqData?.descripcion_generada ?? 
          `No encontré información específica sobre "${pregunta}". Te invito a explorar el catálogo completo o preguntar sobre sitios arqueológicos, danzas, textiles u otras tradiciones de Junín.`
      }

      setMensajes(m => [...m, { rol: 'asistente', texto: respuesta }])
    } catch {
      setMensajes(m => [...m, { 
        rol: 'asistente', 
        texto: 'Lo siento, tuve un problema al procesar tu consulta. Intenta preguntar sobre bienes culturales específicos como "sitios arqueológicos", "danzas tradicionales" o "textiles andinos".' 
      }])
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-6 right-6 z-50 bg-andino-600 hover:bg-andino-700 text-white rounded-full p-4 shadow-lg transition-all"
      >
        {abierto ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {abierto && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '480px' }}>
          <div className="bg-andino-700 text-white px-4 py-3 flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-andino-200" />
            <div>
              <p className="font-semibold text-sm">Asistente Cultural</p>
              <p className="text-xs text-andino-200">Patrimonio Cultural Junín</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-line ${
                  m.rol === 'usuario'
                    ? 'bg-andino-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.texto}
                </div>
              </div>
            ))}
            {cargando && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-andino-500" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-200 p-3 flex gap-2">
            <input
              className="flex-1 input text-sm py-2"
              placeholder="Pregunta sobre patrimonio cultural..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
            />
            <button
              onClick={enviar}
              disabled={!input.trim() || cargando}
              className="bg-andino-600 hover:bg-andino-700 disabled:opacity-40 text-white rounded-lg px-3 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}