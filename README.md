<<<<<<< HEAD
# Monitorização Semáforo da Ponte (V2 - Firebase Edition)

Este projeto monitoriza e regista os estados operacionais da ponte (Aberta, Em Preparação, Fechada) utilizando uma arquitetura Serverless com Firebase.

## 🛠 Pré-requisitos
1. Uma conta no [Firebase Console](https://console.firebase.google.com/).
2. Git instalado na máquina local.
3. Visual Studio Code com a extensão "Live Server".

## 🚀 Guia de Instalação Passo a Passo

### Passo 1: Configurar o Firebase
1. No Firebase Console, cria um novo projeto.
2. Vai a **Build > Firestore Database** e cria uma nova base de dados.
3. Define as **Security Rules** iniciais para ambiente de teste:
   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read: if true;
         allow write: if true; // ALERTA: Em produção, restringir a IPs específicos ou utilizadores autenticados.
       }
     }
   }
=======
# ponte_matosinhos
>>>>>>> 3dd6bfe71043d04d47a9ea6410fee69776e36853
