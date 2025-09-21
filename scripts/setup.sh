#!/bin/bash

echo "🚀 Configuration de l'application E-Signature..."

# Vérification des prérequis
check_prerequisites() {
    echo "Vérification des prérequis..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js non trouvé. Veuillez installer Node.js 20+"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker non trouvé. Veuillez installer Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose non trouvé. Veuillez installer Docker Compose"
        exit 1
    fi
    
    echo "✅ Prérequis satisfaits"
}

# Installation des dépendances
install_dependencies() {
    echo "📦 Installation des dépendances..."
    
    # Backend
    cd apps/backend
    npm install
    cd ../..
    
    # Root
    npm install
    
    echo "✅ Dépendances installées"
}

# Configuration de la base de données
setup_database() {
    echo "🗄️ Configuration de la base de données..."
    
    # Démarrage des services Docker
    docker-compose up -d postgres redis
    
    # Attendre que PostgreSQL soit prêt
    echo "Attente de PostgreSQL..."
    sleep 10
    
    # Exécution des migrations
    cd apps/backend
    npm run migration:run
    
    # Données de test (optionnel)
    read -p "Voulez-vous charger des données de test ? (y/N): " load_fixtures
    if [[ $load_fixtures =~ ^[Yy]$ ]]; then
        npm run seed:run
    fi
    
    cd ../..
    echo "✅ Base de données configurée"
}

# Configuration SSL pour développement
setup_ssl() {
    echo "🔒 Configuration SSL pour développement..."
    
    mkdir -p certs
    
    # Génération certificats auto-signés
    openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes \
        -subj "/C=FR/ST=Paris/L=Paris/O=ESign/OU=Development/CN=localhost"
    
    echo "✅ Certificats SSL générés"
}

# Configuration de l'environnement
setup_environment() {
    echo "⚙️ Configuration de l'environnement..."
    
    # Copie des fichiers d'exemple
    if [ ! -f apps/backend/.env.development ]; then
        cp apps/backend/.env.example apps/backend/.env.development
        echo "📝 Veuillez configurer apps/backend/.env.development"
    fi
    
    # Génération des clés secrètes
    jwt_secret=$(openssl rand -base64 32)
    refresh_secret=$(openssl rand -base64 32)
    encryption_key=$(openssl rand -base64 32)
    
    # Remplacement dans le fichier .env
    sed -i.bak "s/your-super-secret-jwt-key-change-in-production/$jwt_secret/g" apps/backend/.env.development
    sed -i.bak "s/your-refresh-secret-key/$refresh_secret/g" apps/backend/.env.development
    sed -i.bak "s/your-aes-256-encryption-key-32-chars/$encryption_key/g" apps/backend/.env.development
    
    echo "✅ Environnement configuré"
}

# Exécution
main() {
    check_prerequisites
    install_dependencies
    setup_environment
    setup_ssl
    setup_database
    
    echo ""
    echo "🎉 Installation terminée !"
    echo ""
    echo "📋 Prochaines étapes :"
    echo "1. Configurer apps/backend/.env.development"
    echo "2. Lancer l'application : npm run dev"
    echo "3. Accéder à l'API : http://localhost:3001"
    echo "4. Documentation : http://localhost:3001/api"
    echo ""
}

main "$@"