// Jenkinsfile (Declarative Pipeline) - Cập nhật để sử dụng Kaniko trên Kubernetes

pipeline {
    // THAY ĐỔI 1: Định nghĩa Agent là một Pod Kubernetes
    // Thay vì 'agent any', chúng ta định nghĩa một pod với các container cần thiết.
    agent {
        kubernetes {
            // Không sử dụng inheritFrom, định nghĩa toàn bộ Pod YAML
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  # Container 1: Agent JNLP để kết nối với Jenkins Master
  - name: jnlp
    image: jenkins/inbound-agent:jdk17
    args: ['\$(JENKINS_SECRET)', '\$(JENKINS_NAME)']
    workingDir: /home/jenkins/agent
    volumeMounts:
    - name: workspace-volume
      mountPath: /home/jenkins/agent

  # Container 2: Node.js để chạy install và test
  - name: node
    image: node:18-alpine
    command: [sleep]
    args: [9999999]
    volumeMounts:
    - name: workspace-volume
      mountPath: /home/jenkins/agent
      
  # Container 4: Kaniko để build image
  # THAY ĐỔI: Sử dụng image 'debug' của Kaniko. Image này chứa shell và lệnh 'sleep'.
  - name: kaniko
    image: gcr.io/kaniko-project/executor:debug
    imagePullPolicy: Always
    command: [sleep]
    args: [9999999]
    volumeMounts:
    - name: workspace-volume
      mountPath: /home/jenkins/agent
    - name: docker-config
      mountPath: /kaniko/.docker/
  volumes:
  # Volume để chia sẻ workspace giữa tất cả các container
  - name: workspace-volume
    emptyDir: {}
  # Volume từ Secret để Kaniko xác thực với Docker Hub
  - name: docker-config
    secret:
      secretName: dockerhub
      items:
        - key: .dockerconfigjson
          path: config.json
"""
        }
    }

    // THAY ĐỔI 2: Cập nhật biến môi trường
    // DOCKERHUB_CREDENTIALS_ID không còn cần thiết cho việc build
    environment {
        DOCKER_IMAGE_NAME = 'nguyentankdb17/cicd'
        GIT_CONFIG_REPO_CREDENTIALS_ID = 'github'
        GIT_CONFIG_REPO_URL = 'https://github.com/nguyentankdb17/CI-CD'
        // Thêm URL và token của SonarQube. Lấy token từ giao diện SonarQube
        // và lưu nó vào Jenkins Credentials dạng 'Secret text'
        // SONAR_HOST_URL = 'http://sonarqube-svc.sonarqube.svc.cluster.local:9000'
        // SONAR_AUTH_TOKEN_ID = 'sonarqube-token' // ID của credentials chứa token
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                script {
                    echo "Bắt đầu checkout mã nguồn..."
                     git url: 'https://github.com/nguyentankdb17/testCI-CD.git', // <-- THAY BẰNG URL REPO CODE CỦA BẠN
                        branch: 'main', // <-- THAY BẰNG TÊN NHÁNH CỦA BẠN
                        credentialsId: 'github' // <-- THAY BẰNG ID CỦA CREDENTIALS BẠN VỪA TẠO
                    echo "Checkout thành công."
                }
            }
        }

        // THAY ĐỔI 3: Chạy các bước trong container 'node'
        stage('2. Install Dependencies') {
            steps {
                // Chỉ định container 'node' để thực hiện bước này
                container('node') {
                    script {
                        echo "Đang cài đặt các thư viện Node.js..."
                        sh 'npm install'
                        echo "Cài đặt thành công."
                    }
                }
            }
        }

        stage('3. Unit Test & Coverage') {
            steps {
                container('node') {
                    script {
                        echo "Đang chạy Unit Test và tạo báo cáo độ bao phủ..."
                        sh 'npm test'
                        echo "Test hoàn tất."
                    }
                }
            }
        }
        
        // THAY ĐỔI 4: Chạy SonarQube scanner trong container 'sonar-scanner'
        // stage('4. SonarQube Analysis') {
        //     steps {
        //         container('sonar-scanner') {
        //             // Sử dụng credentials chứa token của SonarQube
        //             withCredentials([string(credentialsId: SONAR_AUTH_TOKEN_ID, variable: 'SONAR_TOKEN')]) {
        //                 sh "sonar-scanner -Dsonar.host.url=${SONAR_HOST_URL} -Dsonar.login=${SONAR_TOKEN}"
        //             }
        //         }
        //     }
        // }

        // stage('5. Quality Gate Check') {
        //     steps {
        //         timeout(time: 10, unit: 'MINUTES') {
        //             // Cần cấu hình webhook trong SonarQube để bước này chạy nhanh hơn
        //             waitForQualityGate abortPipeline: true
        //         }
        //         echo "Quality Gate đã PASS!"
        //     }
        // }

        // THAY ĐỔI 5: Giai đoạn quan trọng nhất - Build và Push với KANIKO
        stage('6. Build & Push Docker Image (with Kaniko)') {
            steps {
                // THAY ĐỔI: Chạy `script` ở ngoài `container` để lấy git commit trước
                script {
                    // Bước 1: Lấy git commit hash trong container mặc định 'jnlp' (nơi có git)
                    def gitCommit = sh(script: 'git rev-parse HEAD', returnStdout: true).trim().substring(0, 8)
                    def dockerImageTag = "${DOCKER_IMAGE_NAME}:${gitCommit}"

                    // Bước 2: Đi vào container 'kaniko' để thực hiện build
                    container('kaniko') {
                        echo "Đang build và push image với Kaniko: ${dockerImageTag}"
                        sh """
                        /kaniko/executor --context `pwd` \\
                                         --dockerfile `pwd`/Dockerfile \\
                                         --destination ${dockerImageTag}
                        """
                        echo "Build và push với Kaniko thành công."
                    }
                }
            }
        }
        stage('7. Update K8s Manifest Repo') {
            steps {
                // Chạy trong container mặc định là 'jnlp'
                script {
                    def gitCommit = sh(script: 'git rev-parse HEAD', returnStdout: true).trim().substring(0, 8)
                    def dockerImageTag = "${DOCKER_IMAGE_NAME}:${gitCommit}"

                    echo "Bắt đầu cập nhật kho chứa cấu hình K8s (CD-VDT)..."
                    // Sử dụng credentials để có quyền push vào repo GitHub
                    withCredentials([usernamePassword(credentialsId: GIT_CONFIG_REPO_CREDENTIALS_ID, variable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
                        // Clone repo CD-VDT từ nhánh main vào thư mục cd-vdt-repo
                        sh "git clone -b main https://${GIT_USER}:${GIT_PASS}@github.com/nguyentankdb17/CD-VDT.git cd-vdt-repo"
                        
                        // Di chuyển vào thư mục repo vừa clone
                        dir('cd-vdt-repo') {
                            echo "Đang cập nhật image tag trong app/deployment.yaml thành ${dockerImageTag}"
                            // Cập nhật file deployment.yaml trong thư mục app
                            sh "sed -i 's|image: .*|image: ${dockerImageTag}|g' app/deployment.yaml"
                            
                            // Cấu hình git user
                            sh "git config user.email 'jenkins@example.com'"
                            sh "git config user.name 'Jenkins CI'"
                            
                            // Thêm file đã sửa đổi vào staging
                            sh "git add app/deployment.yaml"
                            sh "git commit -m 'ci: Cập nhật image tag lên ${gitCommit}'"
                            // Đẩy thay đổi lên nhánh main của repo
                            sh "git push origin main"
                        }
                    }
                    echo "Cập nhật kho chứa cấu hình K8s thành công."
                }
            }
        }
    }
    

}
