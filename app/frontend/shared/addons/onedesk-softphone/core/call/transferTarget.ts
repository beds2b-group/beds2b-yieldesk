// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Destino de una transferencia (endpoint 12): un compañero o un número externo (R2b). Lleva uno y
// solo uno de los dos, como el cuerpo que espera One-Desk.
export type TransferTarget = { agentId: number } | { externalNumber: string }
