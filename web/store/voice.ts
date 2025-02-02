import { AppSchema } from '../../srv/db/schema'
import { TTSService } from '../../srv/db/texttospeech-schema'
import { getNativeVoices } from '../shared/Audio/speech'
import { createStore } from './create'
import { voiceApi } from './data/voice'
import { toastStore } from './toasts'
import { userStore } from './user'

type VoiceState = {
  services: Array<{ type: TTSService; label: string }>
  voices: Record<string, AppSchema.VoiceDefinition[]>
}

const initialState: VoiceState = {
  services: [],
  voices: {},
}

export const voiceStore = createStore<VoiceState>(
  'voices',
  initialState
)(() => {
  return {
    getServices() {
      const user = userStore().user
      const services: VoiceState['services'] = []

      if ('speechSynthesis' in window) {
        services.push({
          type: 'webspeechsynthesis',
          label: 'Web Speech Synthesis',
        })
      }

      if (!user) return { services }

      if (user.elevenLabsApiKeySet || user.elevenLabsApiKey) {
        services.push({
          type: 'elevenlabs',
          label: 'ElevenLabs',
        })
      }
      return { services }
    },
    async getVoices({ voices }, type: TTSService | '') {
      if (!type) return
      if (voices[type]?.length > 0) return

      let result = undefined
      if (type === 'webspeechsynthesis') {
        result = await getNativeVoices()
      } else {
        const res = await voiceApi.voicesList(type)
        if (res.error) toastStore.error(`Failed to get voices list: ${res.error}`)
        if (res.result) result = res.result!.voices
      }
      return {
        voices: {
          ...voices,
          [type]: result || [{ id: '', label: 'No voices available' }],
        },
      }
    },
  }
})
