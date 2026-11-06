<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { onErrorCaptured, provide, toRaw } from 'vue'

import { SOFTPHONE_LOCALE } from './i18n/useI18n.ts'
import { provideSoftphoneContext, type SoftphoneContext } from './softphoneContext.ts'
import SoftphoneRoot from './SoftphoneRoot.vue'

// Raíz del custom element <onedesk-softphone>. La shell le pasa el contexto como propiedad del
// elemento (architecture.md §5.4) y aquí se reparte a los stores y componentes.
const props = defineProps<{ context: SoftphoneContext }>()

// Sin el proxy reactivo de las props: el engine y los puertos son objetos del núcleo, que compara por
// identidad (por ejemplo, la escucha pedida en SupervisionController) y no debe ser reactivo.
const context = toRaw(props.context)
provideSoftphoneContext(context)
provide(SOFTPHONE_LOCALE, context.locale)

// Un fallo de la interfaz se registra y no sale del teléfono: nunca llega a Zammad
// (architecture.md §8.3).
onErrorCaptured((error, _instance, info) => {
  context.logger.error('Softphone UI error', {
    info,
    reason: error instanceof Error ? error.message : 'unknown',
  })
  return false
})
</script>

<template>
  <SoftphoneRoot />
</template>
