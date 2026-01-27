#!/bin/bash
# Быстрый старт Garden UI через Docker Compose

echo "🌱 Запуск Garden UI..."

# Проверка .env файла
if [ ! -f .env ]; then
    echo "📋 Создаю .env из .env.example..."
    cp .env.example .env
fi

# Запуск контейнеров
echo "🐳 Запуск Docker Compose..."
docker compose up -d

echo ""
echo "✅ Garden UI запущен!"
echo ""
echo "🌐 Откройте в браузере:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080"
echo ""
echo "🎨 Как переключать темы:"
echo "   1. Откройте http://localhost:3000"
echo "   2. В header справа найдите две иконки:"
echo "      • 🎨 Палитра - выбор темы (Garden/Ocean/Sunset/Forest)"
echo "      • ☀️/🌙 - переключение Light/Dark режима"
echo "   3. Кликните на палитру и выберите тему из списка"
echo ""
echo "📊 Проверить статус контейнеров:"
echo "   docker compose ps"
echo ""
echo "📜 Посмотреть логи:"
echo "   docker compose logs -f frontend"
echo ""
echo "🛑 Остановить все:"
echo "   docker compose down"
echo ""
