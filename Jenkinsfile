pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub')
        DOCKER_IMAGE = 'nguyentankdb17/cicd'
        COMMIT_TAG = "${env.BUILD_NUMBER}"
        CONFIG_REPO = 'https://github.com/nguyentankdb17/CI-CD'
    }

    stages {
        stage('Clone Source Code') {
            steps {
                git url: 'https://github.com/nguyentankdb17/testCI-CD.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t $DOCKER_IMAGE:$COMMIT_TAG ."
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                script {
                    sh "echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin"
                    sh "docker push $DOCKER_IMAGE:$COMMIT_TAG"
                }
            }
        }

        stage('Update Tag in Config Repo') {
            steps {
                dir('config-repo') {
                    git credentialsId: 'github', url: CONFIG_REPO, branch: 'main'
                    script {
                        sh """
                        sed -i 's|image: $DOCKER_IMAGE:.*|image: $DOCKER_IMAGE:$COMMIT_TAG|' values.yaml
                        git config user.email "nguyentankdb17@gmail.com"
                        git config user.name "nguyentankdb17"
                        git commit -am "Update image tag to $COMMIT_TAG"
                        git push origin main
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
