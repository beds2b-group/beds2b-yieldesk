<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()

const confirm = (): void => {
  ui.setConfirmingLogout(false)
  session.dispatch({ type: 'logout' })
}
</script>

<template>
  <div class="sp-confirm" role="alertdialog" aria-modal="true" aria-labelledby="sp-confirm-text">
    <p id="sp-confirm-text" class="sp-confirm__text">{{ t('logout.withCall') }}</p>
    <div class="sp-confirm__buttons">
      <button type="button" class="sp-button" @click="ui.setConfirmingLogout(false)">
        {{ t('logout.cancel') }}
      </button>
      <button
        type="button"
        class="sp-button sp-button--danger"
        data-testid="confirm-logout"
        @click="confirm"
      >
        {{ t('logout.confirm') }}
      </button>
    </div>
  </div>
</template>
