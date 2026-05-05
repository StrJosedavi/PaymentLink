# PixLink

Projeto React + TypeScript open source para gerar links de pagamento Pix em páginas estáticas.

Funciona 100% no GitHub Pages, sem backend e sem dependência de outras plataformas.

## O que este projeto faz

- Gera o payload Pix (copia e cola) localmente no navegador.
- Gera um link de pagamento compartilhável no formato `#/pagamento/:token`.
- Exibe QR Code e código Pix para copiar na página de pagamento.
- Compatível com hospedagem estática no `github.io`.

## Stack

- React
- TypeScript
- Vite
- React Router (HashRouter)
- qrcode.react

## Como rodar localmente

```bash
npm install
npm run dev
```

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub e suba este código na branch `main`.
2. Em `Settings > Pages`, selecione `Build and deployment: GitHub Actions`.
3. Faça push na `main`.
4. O workflow `.github/workflows/deploy.yml` vai gerar e publicar automaticamente.

URL final esperada:

```text
https://SEU_USUARIO.github.io/NOME_DO_REPO/
```

## Observações importantes

- Este projeto não usa banco de dados.
- O link de pagamento carrega os dados codificados no próprio URL.
- Não é um QR dinâmico da API Pix Cobrança; é um gerador de BR Code estático para cobrança simples.

## Licença

[MIT](./LICENSE)
