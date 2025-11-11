# Flow sample payloads

## Create order request

```json
{
  "apiKey": "FLOW_API_KEY",
  "commerceId": "FLOW_COMMERCE_ID",
  "commerceOrder": "c51cecd5-6bf1-4a38-9c54-3d3f13fd13fb",
  "subject": "Reserva bosquesur",
  "currency": "CLP",
  "amount": 210000,
  "email": "paula@example.com",
  "name": "Paula González",
  "urlConfirmation": "https://tresmorros.cl/api/payments/flow/webhook",
  "urlReturn": "https://tresmorros.cl/gracias?bookingId=c51cecd5-6bf1-4a38-9c54-3d3f13fd13fb"
}
```

## Webhook payload

```json
{
  "status": "SUCCESS",
  "commerceOrder": "c51cecd5-6bf1-4a38-9c54-3d3f13fd13fb",
  "flowOrderId": "1102030",
  "token": "e40761d2b9d042918aa2946e7a4a1737",
  "amount": 210000,
  "email": "paula@example.com",
  "subject": "Reserva bosquesur"
}
```
