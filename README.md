<p align="center">
  <img src="assets/icon.svg" width="170" align="center">
</p>

# Gira+
**Gira+** é uma re-implementação da aplicação Gira da Câmara Municipal de Lisboa/EMEL.
Com um olhar atento ao design, à experiência do utilizador (UX) e à estabilidade, este projeto visa proporcionar uma experiência de utilização mais agradável ao sistema de bicicletas partilhadas de Lisboa.

### Desenvolvimento
A aplicação está a ser desenvolvida em **SvelteKit**, juntamente com a biblioteca **Capacitor** para compilar para Android.
A versão para iOS está pendente, aguardando a criação de uma conta de developer da Apple, que tem um custo anual de 100€.
As builds de teste para iOS estão funcionais.


## Instalação e Compilação

### Android
Em breve, estará disponível uma versão pré-compilada para Android. Até lá, a aplicação pode ser compilada seguindo estes passos:

1. Preparação:
 - Garantir que o Android SDK está instalado.
2. Configuração:
 - Clonar o repositório e entrar na sua diretoria.
 - Criar um ficheiro `local.properties` em `android/` com o caminho para o Android SDK, como no exemplo:
 ```properties
 sdk.dir=/opt/android-sdk/
 ```
3. Compilação:
  ```
  npm install
  npm run build-app
  ```
  ou
  ```
  bun install
  bun run build-app
  ```

O ficheiro .apk será criado em `android/app/build/outputs/apk/debug/app-debug.apk`

## Misc
Cumprimentos ao [@afonsosousah](https://github.com/afonsosousah), que inspirou o projeto com o [mGira](https://github.com/afonsosousah/mgira).  
Obrigado ao [@joaodcp](https://github.com/joaodcp), que ajudou com esforços de reverse engineering na do sistema original.  
Agradecimentos à Inês Freitas pelo design do logo da aplicação.