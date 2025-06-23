import axios from 'axios'

const API_KEY = 'sk_f773989a98a0d92135fa007b94fccdc437989aed620aa1cf'

console.log('Testing ElevenLabs API with axios...')
console.log('API Key:', API_KEY)

try {
  const response = await axios.post(
    'https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x',
    {
      text: 'Test',
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0,
        use_speaker_boost: true
      }
    },
    {
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY
      },
      responseType: 'arraybuffer'
    }
  )

  console.log('✅ Success!')
  console.log('Status:', response.status)
  console.log('Content-Type:', response.headers['content-type'])
  console.log('Data size:', response.data.byteLength)

} catch (error) {
  console.log('❌ Error!')
  console.log('Status:', error.response?.status)
  console.log('Headers sent:', error.config?.headers)
  console.log('Message:', error.message)
  console.log('Response data:', error.response?.data?.toString())
} 