# CheckLingo

Extensão para personalizar e melhorar as aulas e partidas de xadrez do Duolingo.

Criada por **[lucrazy-fn](https://github.com/lucrazy-fn)**.

## Recursos

- Substituição personalizada de palavras nos textos das lições.
- Bloqueio do arrasto nativo do tabuleiro sem atrapalhar o movimento das peças.
- Destaque da última jogada, com cores separadas para você e o adversário.
- Coordenadas nas bordas do tabuleiro.
- Setas para visualizar jogadas.
- Histórico da partida com ícones das peças e casas de origem e destino.
- Interface em português, inglês e espanhol.
- Compatibilidade com Firefox e navegadores Chromium, como Chrome, Brave, Edge, Opera e Vivaldi.

## Instalação

### Firefox

1. Baixe `checklingo-firefox.zip` na pasta [`site/downloads`](site/downloads).
2. Extraia o arquivo.
3. Abra `about:debugging#/runtime/this-firefox`.
4. Clique em **Carregar extensão temporária**.
5. Selecione o arquivo `manifest.json` da pasta extraída.

### Chrome, Brave, Edge, Opera ou Vivaldi

1. Baixe `checklingo-chromium.zip` na pasta [`site/downloads`](site/downloads).
2. Extraia o arquivo.
3. Abra a página de extensões do navegador e ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta extraída.

## Estrutura do repositório

- [`extension`](extension): código-fonte da extensão.
- [`site`](site): landing page do CheckLingo.

## Privacidade

O CheckLingo funciona localmente no navegador. As preferências são armazenadas pelo próprio navegador e a extensão não envia dados para servidores próprios.

## Licença

Distribuído sob a [licença MIT](LICENSE).

CheckLingo é um projeto independente e não possui vínculo oficial com o Duolingo.