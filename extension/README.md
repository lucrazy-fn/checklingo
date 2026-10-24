# CheckLingo

Extensão independente Manifest V3, criada por **lucrazy-fn**, para Firefox e navegadores Chromium. Ela aplica ajustes às lições e partidas de xadrez do Duolingo. Não é um produto oficial do Duolingo.

A interface pode seguir automaticamente o idioma do navegador ou ser definida no popup como **Português, English ou Español**. A troca personalizada aceita palavras com letras Unicode, portanto também pode ser usada com outros idiomas.

## Funções

- **Trocar palavra:** escolha uma palavra e a substituição. O padrão é `dama → rainha`. A troca respeita maiúsculas e palavras inteiras, inclusive em textos dinâmicos e balões animados. Ela não altera o áudio gravado pelo Duolingo nem campos de texto.
- **Destacar última jogada:** marca as casas de origem e destino assim que você solta a peça. Enquanto a peça está sendo segurada, a extensão não registra a casa como destino. Um lance do adversário detectado logo em seguida aguarda até 1,2 segundo antes de substituir o seu destaque. Você pode escolher uma cor para a sua jogada e outra para a do adversário no popup ou nos botões de cores prontas; a cor já salva para sua jogada é preservada ao atualizar. A extensão observa mudanças estáveis no tabuleiro para detectar lances automáticos; animações ou jogadas muito rápidas podem impedir essa detecção. Se a leitura do canvas for bloqueada, a detecção automática do adversário não funciona. O destaque não recebe cliques e se oculta quando a casa está coberta por outro elemento da página.
- **Coordenadas:** centraliza as letras nas colunas da borda inferior e os números junto às linhas da borda esquerda. A orientação pode ser escolhida no popup conforme as peças escuras ou claras estejam embaixo. O padrão é **escuras embaixo**, como nas partidas mostradas durante o desenvolvimento. As etiquetas não recebem cliques e se ocultam quando o tabuleiro está coberto.
- **Setas de planejamento:** segure o botão direito do mouse numa casa, arraste até outra e solte para desenhar uma seta verde. É possível manter várias setas; repita o mesmo trajeto para remover uma delas ou clique com o botão direito numa casa sem arrastar para limpar todas. As setas não movem peças e desaparecem ao sair do tabuleiro ou desligar a opção. O menu de contexto do Firefox fica desativado sobre as casas enquanto a função estiver ligada.
- **Histórico das jogadas:** mostra ao lado do tabuleiro cada lance que a extensão consegue confirmar, com as casas de origem e destino. A peça pode aparecer como símbolo vetorial ou letra localizada. Quando o Duolingo confirma xeque ou xeque-mate, o lance recebe `+` ou `#`. O histórico começa quando a extensão entra na partida e é limpo quando o tabuleiro ou a página muda; ele não recupera lances anteriores. Em posições que não começam na formação inicial, o tipo de algumas peças pode ser estimado pelo movimento.
- **Aparência:** o popup e o histórico podem usar o tema claro, escuro ou acompanhar o sistema.
- **Fixar o tabuleiro:** impede o arrasto nativo do canvas e de imagens identificadas como fundo do tabuleiro, preservando os eventos usados para mover as peças.

As opções podem ser ligadas ou desligadas no popup, que também mostra quais estão ativas na página atual. A extensão se ativa automaticamente nas lições de xadrez e na página de partida (`/chess-match`). As preferências ficam salvas no Firefox.

**Atalho:** pressione `Alt+Shift+H` numa lição ou partida de xadrez ativa para ligar ou desligar o destaque da última jogada. O popup mostra o atalho efetivo. Se houver conflito com outro atalho, altere-o no Firefox em `about:addons` → **Gerenciar atalhos de extensões**.

## Instalar no Firefox

1. Baixe e extraia o ZIP, ou use esta pasta do projeto.
2. Abra `about:debugging` no Firefox e escolha **Este Firefox**.
3. Clique em **Carregar extensão temporária** e selecione `manifest.json`.
4. Abra ou recarregue uma lição ou partida de xadrez do Duolingo.
5. Clique no ícone do rei para configurar as opções.

Ao atualizar, remova a versão temporária antiga, carregue o novo `manifest.json` e recarregue a aba do Duolingo. A extensão temporária deixa de estar carregada quando o Firefox reinicia.

## Instalar no Chrome, Brave, Edge, Vivaldi ou Opera

Use a pasta ou o ZIP **CheckLingo Chromium**. Extraia o ZIP, abra a página de extensões do navegador, ative o modo de desenvolvedor e escolha **Carregar sem compactação**:

- Chrome: `chrome://extensions`
- Brave: `brave://extensions`
- Edge: `edge://extensions`
- Vivaldi: `vivaldi://extensions`
- Opera: `opera://extensions`

Selecione a pasta extraída que contém `manifest.json`. Ao atualizar, substitua os arquivos, clique em **Recarregar** na página de extensões e recarregue a aba do Duolingo.

Outros navegadores baseados em Chromium, como Arc, devem aceitar o mesmo pacote. Navegadores baseados em Firefox, como LibreWolf, Waterfox e Zen Browser, devem aceitar o pacote do Firefox. Esses derivados ainda precisam de teste individual.

## Estrutura para desenvolvimento

`manifest.json` é a variante do Firefox. `manifest.chromium.json` contém a variante Chromium e deve ser renomeado para `manifest.json` dentro do pacote destinado a Chrome e derivados. O restante do código é compartilhado pelas duas versões.

## Privacidade e limitações

A extensão atua apenas em `duolingo.com` e `www.duolingo.com`. Usa a permissão de armazenamento para guardar as opções localmente. Não coleta nem envia dados. O Duolingo pode mudar a estrutura das páginas, o que pode afetar as funções.

O código passou nos testes locais para as duas variantes do manifesto. O funcionamento no site pode variar conforme a lição, a partida e a versão do navegador. A compatibilidade no site não foi confirmada em todos os navegadores listados.

## Licença

Código disponibilizado sob a [licença MIT](LICENSE). Copyright © 2026 lucrazy-fn.

