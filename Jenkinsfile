pipeline {
    agent {
      kubernetes {
        yaml '''
            apiVersion: v1
            kind: Pod
            spec:
              containers:
              - name: docker
                image: docker:20.10.21-dind
                securityContext:
                  privileged: true
                command:
                - dockerd-entrypoint.sh
                args:
                - --host=tcp://localhost:2375
                - --host=unix:///var/run/docker.sock
                tty: true
              - name: jnlp
                image: jenkins/inbound-agent:latest
                args: ["$(JENKINS_SECRET)", "$(JENKINS_NAME)"]
            '''
        defaultContainer 'docker'
      }
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub')
        DOCKER_IMAGE = 'nguyentankdb17/cicd'
        COMMIT_TAG = "${env.BUILD_NUMBER}"
        CONFIG_REPO = 'https://github.com/nguyentankdb17/CI-CD'
    }

    stages {
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
