## 0.测试环境
- 本次安装测试环境为阿里云服务器，实例名称：ecs.c5.xlarge
- 本次测试时间：2018-09-04

## 1. Git
如果未安装[Git](https://git-scm.com/downloads)
或者命令行输入
```
apt install git -y
```
检查git是否安装
```
git --version
git version 2.7.4
```
## 2. Golang
安装go语言环境，由于采用Fabric 1.2.0所以需要go语言环境>1.10.x
- [GoLang 下载页](https://golang.org/dl)
- [GoLang 安装](https://golang.org/doc/install)
- [GoLang 文档](https://golang.org/doc/)

golang还有中文网站，[下载页](https://studygolang.com/dl)。
命令行环境下
```
wget https://studygolang.com/dl/golang/go1.10.4.linux-amd64.tar.gz
tar -C /usr/local/ -xf go1.10.4.linux-amd64.tar.gz
```
将go语言添加进入环境：
```
vim ~/.bashrc

export GOPATH=/home/ypf/ypf-app/goapp
export PATH=$GOPATH/bin:/usr/local/go/bin:$PATH
```
验证go安装
```
go version
go version go1.10.4 linux/amd64
```
并且不要忘记设置**GOPATH**
## 3. Node.js
下载nodejs
- [Node.js 下载页](https://nodejs.org/en/download/)
命令行环境下
```
wget https://nodejs.org/dist/v8.11.4/node-v8.11.4-linux-x64.tar.xz
tar -C /usr/local/ -xf node-v8.11.4-linux-x64.tar.xz
```
将nodejs语言添加进入环境：
```
vim ~/.bashrc

export PATH=/usr/local/node-v8.11.4-linux-x64/bin:$PATH
```
验证node.js
```
node -v
v8.11.4
```
## 4. Docker
- [Docker 下载页](https://docs.docker.com/install/linux/docker-ce/ubuntu/)
Docker安装上述下载链接已经提供了命令行安装方法，不予列出。
验证docker安装
```
docker --version
Docker version 18.06.1-ce, build e68fc7a
```
## 5. docker-compose
- [docker-compose 下载页](https://docs.docker.com/compose/)
验证docker-compose安装
```
docker-compose --version
docker-compose version 1.22.0, build f46880fe
```
## 6. Fabric环境与实例安装
安装Fabric实例
```
mkdir -p ~/go/src
cd ~/go/src
git clone https://github.com/hyperledger/fabric-samples
```
安装Fabric环境
```
cd fabric-samples/scripts
./bootstrap.sh
```
正常安装完成后，查看安装docker
```
docker images

hyperledger/fabric-ca          1.2.0               66cc132bd09c        2 months ago        252MB
hyperledger/fabric-ca          latest              66cc132bd09c        2 months ago        252MB
hyperledger/fabric-tools       1.2.0               379602873003        2 months ago        1.51GB
hyperledger/fabric-tools       latest              379602873003        2 months ago        1.51GB
hyperledger/fabric-ccenv       1.2.0               6acf31e2d9a4        2 months ago        1.43GB
hyperledger/fabric-ccenv       latest              6acf31e2d9a4        2 months ago        1.43GB
hyperledger/fabric-orderer     1.2.0               4baf7789a8ec        2 months ago        152MB
hyperledger/fabric-orderer     latest              4baf7789a8ec        2 months ago        152MB
hyperledger/fabric-peer        1.2.0               82c262e65984        2 months ago        159MB
hyperledger/fabric-peer        latest              82c262e65984        2 months ago        159MB
hyperledger/fabric-zookeeper   0.4.10              2b51158f3898        2 months ago        1.44GB
hyperledger/fabric-zookeeper   latest              2b51158f3898        2 months ago        1.44GB
hyperledger/fabric-kafka       0.4.10              936aef6db0e6        2 months ago        1.45GB
hyperledger/fabric-kafka       latest              936aef6db0e6        2 months ago        1.45GB
hyperledger/fabric-couchdb     0.4.10              3092eca241fc        2 months ago        1.61GB
hyperledger/fabric-couchdb     latest              3092eca241fc        2 months ago        1.61GB
hyperledger/fabric-baseos      amd64-0.4.10        52190e831002        2 months ago        132MB
```

