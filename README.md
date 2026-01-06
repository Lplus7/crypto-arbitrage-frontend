# Crypto Arbitrage Frontend

Веб-интерфейс для мониторинга криптовалютных арбитражных возможностей.

## Технологии
- React 18
- Vite
- Tailwind CSS
- Axios

## Установка

```bash
npm install
npm run dev
```

## Переменные окружения

Создайте файл `.env` на основе `.env.example`:

```
VITE_API_URL=https://your-backend-api.com/api/v1
```

## Деплой на Vercel

1. Подключите репозиторий к Vercel
2. Установите переменную окружения `VITE_API_URL` в настройках проекта
3. Vercel автоматически задеплоит при каждом push в main
