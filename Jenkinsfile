pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        MYSQL_ROOT_PASSWORD = credentials('MYSQL_ROOT_PASSWORD')
        MYSQL_PASSWORD      = credentials('MYSQL_PASSWORD')
        TEST_ADMIN_EMAIL    = credentials('TEST_ADMIN_EMAIL')
        TEST_PASSWORD       = credentials('TEST_PASSWORD')
        CUSTOMER_EMAIL      = credentials('CUSTOMER_EMAIL')
        NEW_USER_PASSWORD   = credentials('NEW_USER_PASSWORD')
        BASE_URL            = 'http://localhost:4200'
        API_URL             = 'http://localhost:8091'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Start application') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml up -d'
            }
        }

        stage('Seed database') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml exec -T laravel-api php artisan migrate:fresh --seed --force'
                sh 'docker compose -f docker-compose.ci.yml exec -T laravel-api php artisan cache:clear'
            }
        }

        stage('Wait for API') {
            steps {
                sh "timeout 120 bash -c 'until [ \"\$(curl -s -o /dev/null -w \"%{http_code}\" http://localhost:8091/products)\" = \"200\" ]; do echo \"waiting...\"; sleep 5; done'"
            }
        }

        stage('Wait for Angular UI') {
            steps {
                sh "timeout 300 bash -c 'until curl -sf http://localhost:4200 > /dev/null; do sleep 10; done'"
            }
        }

        stage('Install dependencies') {
            steps {
                nodejs(nodeJSInstallationName: 'Node 25') {
                    sh 'npm ci'
                    sh 'npx playwright install --with-deps chromium'
                }
            }
        }

        stage('Run Playwright tests') {
            steps {
                nodejs(nodeJSInstallationName: 'Node 25') {
                    sh 'npx playwright test'
                }
            }
        }

        stage('Run k6 performance tests') {
            steps {
                sh 'npm run k6:all'
            }
        }
    }

    post {
        always {
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'playwright-report',
                reportFiles: 'index.html',
                reportName: 'Playwright Report'
            ])
            sh 'docker compose -f docker-compose.ci.yml down'
        }
    }
}
