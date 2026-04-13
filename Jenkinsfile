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
        BASE_URL            = 'http://172.17.0.1:4200'
        API_URL             = 'http://172.17.0.1:8091'
        HOST_WORKSPACE      = '/var/lib/docker/volumes/jenkins_home/_data/workspace/toolshop-playwright'
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
                sh "timeout 120 bash -c 'until [ \"\$(curl -s -o /dev/null -w \"%{http_code}\" http://172.17.0.1:8091/products)\" = \"200\" ]; do echo \"waiting...\"; sleep 5; done'"
            }
        }

        stage('Wait for Angular UI') {
            steps {
                sh "timeout 300 bash -c 'until curl -sf http://172.17.0.1:4200 > /dev/null; do sleep 10; done'"
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
        failure {
            archiveArtifacts artifacts: 'test-results/**/*.zip, test-results/**/*.png, test-results/**/*.webm', allowEmptyArchive: true
        }
        always {
            sh 'docker compose -f docker-compose.ci.yml down'
        }
    }
}
