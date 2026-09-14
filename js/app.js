/* =====================================================================
   JAPA SUSHI CBBA — LÓGICA DO APP
   Sem dependências. Todo o cardápio vem de js/cardapio.js
   ===================================================================== */
(function () {
  "use strict";

  /* ---------------- Utilidades ---------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const brl = (n) => "Bs " + Number(n).toFixed(2).replace(".", ",");
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const uid = () => Math.random().toString(36).slice(2, 9);

  // Meta Pixel. Silencioso de propósito: se o fbq não existir (bloqueador de
  // anúncios, sem internet), o cardápio segue funcionando normalmente.
  function pixel(evento, dados) {
    try { if (typeof fbq === "function") fbq("track", evento, dados); } catch (e) {}
  }

  /* ---------------- Estado ---------------- */
  const STORE_KEY = "japasushicbba_cart_v1";
  let carrinho = [];
  let estadoModal = null; // dados temporários do produto em personalização
  let frete = { status: "consultar", valor: null, distanciaKm: null }; // status: consultar | ok | fora

  function salvar() { try { localStorage.setItem(STORE_KEY, JSON.stringify(carrinho)); } catch (e) {} }
  function carregar() { try { carrinho = JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { carrinho = []; } }

  /* ---------------- Horário de funcionamento ---------------- */
  function lojaAberta() {
    const agora = new Date();
    const dia = agora.getDay(); // 0=dom ... 6=sáb
    const h = agora.getHours() + agora.getMinutes() / 60;
    // Lunes: cerrado | Martes a Domingo: 17h-22h
    if (dia === 1) return false;
    return h >= 17 && h < 22;
  }

  function renderStatusLoja() {
    const wrap = $("#statusLoja");
    const aberta = lojaAberta();
    wrap.innerHTML =
      `<span class="status-bolinha ${aberta ? "" : "fechado"}"></span>` +
      `<span>${aberta ? "Abierto ahora" : "Cerrado ahora"} · Martes a Domingo 17h a 22h · Lunes cerrado</span>`;
  }

  /* ---------------- Cabeçalho ---------------- */
  function renderCabecalho() {
    $("#logoNome").innerHTML = "Japa <span>Sushi</span> CBBA";
    $("#logoTel").innerHTML = `<span class="material-symbols-rounded" style="font-size:14px">call</span> ${LOJA.telefoneExibicao}`;
    const linkWpp = `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent("¡Hola! Vine por el menú digital de Japa Sushi CBBA y me gustaría hacer un pedido.")}`;
    $("#headerWpp").href = linkWpp;
    $("#fabWpp").href = linkWpp;
    $("#rodapeWpp").href = linkWpp;
    // rodapé
    $("#rodapeNome").innerHTML = "Japa <span>Sushi</span> CBBA";
    $("#rodapeEndereco").textContent = `${LOJA.endereco.linha1} · ${LOJA.endereco.linha2} · ${LOJA.endereco.cidade} · CEP ${LOJA.endereco.cep}`;
    $("#rodapeHorarios").innerHTML = LOJA.horarios.map(h => `<span>${h.dias}: <b>${h.horario}</b></span>`).join("");
  }

  /* ---------------- Navegação de categorias ---------------- */
  function renderNavCats() {
    const inner = $("#navCatsInner");
    inner.innerHTML = "";
    CATEGORIAS.forEach((cat, i) => {
      const b = el("button", i === 0 ? "ativo" : "", `${cat.emoji} ${cat.nome}`);
      b.dataset.target = "cat-" + cat.id;
      b.addEventListener("click", () => {
        const alvo = $("#cat-" + cat.id);
        const y = alvo.getBoundingClientRect().top + window.scrollY - 116;
        window.scrollTo({ top: y, behavior: "smooth" });
      });
      inner.appendChild(b);
    });
  }

  /* ---------------- Vitrine de destaques ---------------- */
  function renderDestaques() {
    const wrap = $("#destaques");
    wrap.innerHTML = "";
    const itens = [];
    CATEGORIAS.forEach(cat => cat.itens.forEach(it => { if (it.destaque || it.maisVendido) itens.push(it); }));
    itens.slice(0, 8).forEach(it => {
      const precoBase = it.preco != null ? it.preco : (it.tamanhos ? it.tamanhos[0].preco : 0);
      const card = el("div", "destaque-card");
      const rotulo = (it.preco != null || (it.tamanhos && it.tamanhos.length === 1))
        ? brl(precoBase)
        : "desde " + brl(precoBase);
      card.innerHTML =
        (it.img ? `<img loading="lazy" src="${it.img}" alt="${it.nome}">`
          : `<div class="modal__foto-fb" style="height:130px">${it.emojiFallback || "🍣"}</div>`) +
        `<div class="destaque-card__body">
           <div class="destaque-card__nome">${it.nome}</div>
           <div class="destaque-card__preco">${rotulo}</div>
         </div>`;
      card.addEventListener("click", () => abrirModal(it));
      wrap.appendChild(card);
    });
  }

  /* ---------------- Cards de produtos ---------------- */
  function cardProduto(it) {
    const card = el("article", "produto reveal" + (it.realce ? " produto--realce" : ""));
    card.dataset.nome = it.nome.toLowerCase();
    card.dataset.desc = (it.descricao || "").toLowerCase();

    const precoBase = it.preco != null ? it.preco : (it.tamanhos ? it.tamanhos[0].preco : 0);
    // "a partir de" só faz sentido quando há mais de um tamanho para escolher
    const precoUnico = it.preco != null || (it.tamanhos && it.tamanhos.length === 1);
    const precoLabel = precoUnico
      ? `<span class="produto__preco">${brl(precoBase)}</span>`
      : `<span class="produto__preco"><small>desde</small> ${brl(precoBase)}</span>`;

    const selo = it.selo ? `<span class="produto__selo">${it.selo}</span>`
      : (it.maisVendido ? `<span class="produto__selo">Más pedido</span>`
        : (it.destaque ? `<span class="produto__selo">Destacado</span>` : ""));

    const foto = it.img
      ? `<img loading="lazy" src="${it.img}" alt="${it.nome}">`
      : `<div class="emoji-fb">${it.emojiFallback || "🍣"}</div>`;

    card.innerHTML = `
      <div class="produto__foto">${selo}${foto}</div>
      <div class="produto__info">
        <div class="produto__nome">${it.nome}</div>
        <div class="produto__desc">${it.descricao || ""}</div>
        <div class="produto__rodape">
          ${precoLabel}
          <button class="btn-add" aria-label="Agregar ${it.nome} al carrito">
            <span class="material-symbols-rounded">add_shopping_cart</span> Agregar
          </button>
        </div>
      </div>`;
    $(".btn-add", card).addEventListener("click", () => abrirModal(it));
    return card;
  }

  function renderCategorias() {
    const main = $("#catalogo");
    main.innerHTML = "";
    CATEGORIAS.forEach(cat => {
      const sec = el("section", "cat");
      sec.id = "cat-" + cat.id;
      sec.innerHTML = `
        <div class="cat__cabecalho">
          <h2 class="cat__titulo"><span class="emoji">${cat.emoji}</span> ${cat.nome}</h2>
          <p class="cat__desc">${cat.descricao || ""}</p>
        </div>`;
      const grid = el("div", "grid-produtos");
      cat.itens.forEach(it => grid.appendChild(cardProduto(it)));
      sec.appendChild(grid);
      main.appendChild(sec);
    });
    ativarReveal();
  }

  /* ---------------- Busca ---------------- */
  function initBusca() {
    const input = $("#buscaInput");
    const limpar = $("#buscaLimpar");
    input.addEventListener("input", () => {
      const termo = input.value.trim().toLowerCase();
      limpar.style.display = termo ? "block" : "none";
      $$(".produto").forEach(card => {
        const bate = !termo || card.dataset.nome.includes(termo) || card.dataset.desc.includes(termo);
        card.style.display = bate ? "" : "none";
      });
      // esconde categorias sem resultado
      $$(".cat").forEach(sec => {
        const visiveis = $$(".produto", sec).some(c => c.style.display !== "none");
        sec.style.display = visiveis ? "" : "none";
      });
      const algum = $$(".produto").some(c => c.style.display !== "none");
      $("#semResultado").style.display = algum ? "none" : "block";
    });
    limpar.addEventListener("click", () => { input.value = ""; input.dispatchEvent(new Event("input")); input.focus(); });
  }

  /* =====================================================================
     MODAL DE PERSONALIZAÇÃO
     ===================================================================== */
  function abrirModal(it) {
    estadoModal = {
      item: it,
      qtd: 1,
      tamanho: null,
      fruta: null,
      calda: null,
      acompanhamentos: [],
      sabores: [],
      rolls: [],
      saborUnico: null,
      brinde: null,
      upsell: false,
      brindeUpsell: null,
      trio: false,
      bebidaTrio: null,
      molhos: [],
      adicionais: [],
      obs: ""
    };
    const modal = $("#modal");
    const foto = it.img
      ? `<img class="modal__foto" src="${it.img}" alt="${it.nome}">`
      : `<div class="modal__foto-fb">${it.emojiFallback || "🍣"}</div>`;

    let corpo = `
      <div class="modal__nome">${it.nome}</div>
      <div class="modal__desc">${it.descricao || ""}</div>`;
    if (it.composicao) corpo += `<div class="modal__comp"><b>Vem com:</b> ${it.composicao.join(", ")}.</div>`;

    corpo += construirGrupos(it);
    // observação (para todos)
    corpo += `
      <div class="grupo">
        <div class="grupo__cabecalho"><span class="grupo__titulo">¿Alguna observación? <span class="passo" style="display:inline;color:var(--cinza-2)">opcional</span></span></div>
        <textarea class="obs-campo" id="modalObs" placeholder="Ej: más wasabi, sin cebollín, punto del salmón..."></textarea>
      </div>`;

    modal.innerHTML = `
      <div class="modal__topo">
        ${foto}
        <button class="modal__fechar" id="modalFechar" aria-label="Fechar"><span class="material-symbols-rounded">close</span></button>
      </div>
      <div class="modal__corpo">${corpo}</div>
      <div class="modal__rodape">
        <div class="qtd">
          <button id="qtdMenos" aria-label="Diminuir">−</button>
          <span id="qtdValor">1</span>
          <button id="qtdMais" aria-label="Aumentar">+</button>
        </div>
        <button class="btn-confirmar" id="btnConfirmar" disabled>
          <span>Agregar</span><span id="btnConfirmarValor"></span>
        </button>
      </div>`;

    // listeners
    $("#modalFechar").addEventListener("click", fecharModal);
    $("#modalObs").addEventListener("input", e => { estadoModal.obs = e.target.value; });
    $("#qtdMenos").addEventListener("click", () => mudarQtdModal(-1));
    $("#qtdMais").addEventListener("click", () => mudarQtdModal(1));
    $("#btnConfirmar").addEventListener("click", confirmarModal);
    ligarGrupos(it);

    $("#modalOverlay").classList.add("aberto");
    document.body.style.overflow = "hidden";
    atualizarConfirmar();

    pixel("ViewContent", {
      content_name: it.nome,
      content_ids: [it.id],
      content_type: "product",
      value: it.preco != null ? it.preco : (it.tamanhos ? it.tamanhos[0].preco : 0),
      currency: "BOB"
    });
  }

  function fecharModal() {
    $("#modalOverlay").classList.remove("aberto");
    document.body.style.overflow = "";
    estadoModal = null;
  }

  function construirGrupos(it) {
    let h = "";
    const grupo = (titulo, passo, contadorId, conteudo, avisoId) =>
      `<div class="grupo">
         <div class="grupo__cabecalho">
           <span class="grupo__titulo">${passo ? `<span class="passo">Paso ${passo}</span>` : ""}${titulo}</span>
           ${contadorId ? `<span class="grupo__contador" id="${contadorId}"></span>` : ""}
         </div>
         ${conteudo}
         ${avisoId ? `<div class="grupo__aviso" id="${avisoId}">Alcanzaste el límite de opciones.</div>` : ""}
       </div>`;

    if (it.tipo === "acai-fixo" || it.tipo === "monte") {
      const tams = it.tamanhos.map(t =>
        `<button class="tamanho" data-preco="${t.preco}" data-rotulo="${t.rotulo}" ${t.limite ? `data-limite="${t.limite}"` : ""}>
           <div class="tamanho__rotulo">${t.rotulo}</div>
           <div class="tamanho__preco">${brl(t.preco)}</div>
           ${t.limite ? `<div class="tamanho__limite">${t.limite} acomp.</div>` : ""}
         </button>`).join("");
      h += grupo("Elegí una opción", "1", null, `<div class="tamanhos" id="grpTamanhos">${tams}</div>`);
    }

    // Sabor único (ex: cupmaki) — seleção única, sem custo extra
    if (it.saborUnico) {
      h += grupo("Elegí el sabor", it.tamanhos ? "2" : "1", null,
        `<div class="opcoes" id="grpSaborU">${it.saborUnico.map(s => opcaoBtn(s)).join("")}</div>`);
    }

    // Armá tu propio combo: tamaño (cantidad) + rolls (1 a N) + rellenos (1 a M)
    if (it.tipo === "armar") {
      const tams = it.tamanhos.map(t =>
        `<button class="tamanho" data-preco="${t.preco}" data-rotulo="${t.rotulo}">
           <div class="tamanho__rotulo">${t.rotulo}</div>
           <div class="tamanho__preco">${brl(t.preco)}</div>
         </button>`).join("");
      h += grupo("Elegí la cantidad", "1", null, `<div class="tamanhos" id="grpTamanhos">${tams}</div>`);
      h += grupo(`Elegí el roll <span class="passo" style="display:inline;color:var(--cinza-2)">1 a ${it.limiteRolls}</span>`,
        "2", "contRolls",
        `<div class="opcoes" id="grpRolls">${it.opcoesRolls.map(r => opcaoBtn(r)).join("")}</div>`, "avisoRolls");
      h += grupo(`Elegí el relleno <span class="passo" style="display:inline;color:var(--cinza-2)">1 a ${it.limiteSabores}</span>`,
        "3", "contSaboresA",
        `<div class="opcoes" id="grpSaboresA">${it.opcoesSabores.map(s => opcaoBtn(s, it.saboresExtra && it.saboresExtra[s])).join("")}</div>`, "avisoSaboresA");
    }

    // Brinde: seleção única, obrigatória e sem custo (promoções)
    if (it.brinde) {
      h += grupo(`${it.brinde.titulo} <span class="passo" style="display:inline;color:var(--dourado)">de regalo</span>`,
        it.tamanhos ? "2" : "1", null,
        `<div class="opcoes" id="grpBrinde">${it.brinde.opcoes.map(o => opcaoBtn(o)).join("")}</div>`);
    }

    // Upsell: segundo copo opcional, com o brinde dele
    if (it.upsell) {
      const u = it.upsell;
      h += grupo(`${u.titulo} <span class="passo" style="display:inline;color:var(--dourado)">+ ${brl(u.preco)}</span>`, null, null,
        `<div class="modal__comp" style="margin:0 0 8px">${u.rotulo}. ${u.descricao}.</div>
         <div class="toggle-sim-nao" id="grpUpsell">
           <button data-upsell="nao" class="on">Não</button>
           <button data-upsell="sim">Sim</button>
         </div>
         <div id="grpBrindeUpsellWrap" style="display:none;margin-top:10px">
           <div class="grupo__titulo" style="font-size:.88rem;margin-bottom:8px">${u.brinde.titulo}</div>
           <div class="opcoes" id="grpBrindeUpsell">${u.brinde.opcoes.map(o => opcaoBtn(o)).join("")}</div>
         </div>`);
    }

    if (it.tipo === "monte" || it.tipo === "barca") {
      const passoBase = it.tipo === "monte" ? 2 : 1;
      // fruta
      h += grupo("Elegí la fruta", String(passoBase), null,
        `<div class="opcoes" id="grpFruta">${it.opcoes.frutas.map(f => opcaoBtn(f)).join("")}</div>`);
      // calda
      h += grupo("Elegí la salsa", String(passoBase + 1), null,
        `<div class="opcoes" id="grpCalda">${it.opcoes.caldas.map(c => opcaoBtn(c)).join("")}</div>`);
      // acompanhamentos
      const limiteTxt = it.tipo === "barca" ? `hasta ${it.limite}` : "según el tamaño";
      h += grupo(`Acompañamientos <span class="passo" style="display:inline;color:var(--cinza-2)">${limiteTxt}</span>`,
        String(passoBase + 2), "contAcomp",
        `<div class="opcoes" id="grpAcomp">${it.opcoes.acompanhamentos.map(a => opcaoBtn(a)).join("")}</div>`, "avisoAcomp");
    }

    if (it.tipo === "combo") {
      h += grupo(`Elegí ${it.quantidadeSabores} piezas`, "1", "contSabores",
        `<div class="opcoes" id="grpSabores">${it.saboresDisponiveis.map(s => opcaoBtn(s)).join("")}</div>`, "avisoSabores");
    }

    if (it.tipo === "hamburguer" && it.trio && it.trio.disponivel) {
      h += grupo(`¿Convertir en Combo? <span class="passo" style="display:inline;color:var(--dourado)">+ ${brl(it.trio.valor)}</span>`, null, null,
        `<div class="modal__comp" style="margin:0 0 8px">${it.trio.descricao}.</div>
         <div class="toggle-sim-nao" id="grpTrio">
           <button data-trio="nao" class="on">Não</button>
           <button data-trio="sim">Sim</button>
         </div>
         <div id="grpBebidaWrap" style="display:none;margin-top:10px">
           <div class="grupo__titulo" style="font-size:.88rem;margin-bottom:8px">Elegí la bebida</div>
           <div class="opcoes" id="grpBebida">${it.trio.bebidas.map(b => opcaoBtn(b)).join("")}</div>
         </div>`);
    }

    if (it.tipo === "baguete") {
      h += `<div class="modal__comp"><b>Incluye:</b> ensalada especial.</div>`;
      h += grupo(`Salsas <span class="passo" style="display:inline;color:var(--cinza-2)">hasta ${it.molhos.limite}</span>`, "1", "contMolhos",
        `<div class="opcoes" id="grpMolhos">${it.molhos.opcoes.map(m => opcaoBtn(m)).join("")}</div>`, "avisoMolhos");
    }

    // Frutas e acompanhamentos como adicional (copos premium)
    if (it.frutasAcompAdicional) {
      h += grupo(`Agregá frutas <span class="passo" style="display:inline;color:var(--dourado)">+ ${brl(PRECO_ADICIONAL_ITEM)} c/u</span>`, null, null,
        `<div class="opcoes" id="grpFrutaAdd">${OPCOES.frutas.map(f => opcaoBtn(f, PRECO_ADICIONAL_ITEM)).join("")}</div>`);
      h += grupo(`Agregá acompañamientos <span class="passo" style="display:inline;color:var(--dourado)">+ ${brl(PRECO_ADICIONAL_ITEM)} c/u</span>`, null, null,
        `<div class="opcoes" id="grpAcompAdd">${OPCOES.acompanhamentos.map(a => opcaoBtn(a, PRECO_ADICIONAL_ITEM)).join("")}</div>`);
    }

    // Adicionais / order bump
    const adics = adicionaisDoItem(it);
    if (adics) {
      h += grupo(`Adicionales <span class="passo" style="display:inline;color:var(--cinza-2)">opcional</span>`, null, null,
        `<div class="opcoes opcoes--lista" id="grpAdicionais">${adics.map(a => opcaoBtn(a.nome, a.preco)).join("")}</div>`);
    }

    return h;
  }

  // Lista de adicionais do produto: só aparece quando o item define "adicionais".
  function adicionaisDoItem(it) {
    return it.adicionais || null;
  }

  function opcaoBtn(nome, preco) {
    return `<button class="opcao" data-nome="${nome}"${preco ? ` data-preco="${preco}"` : ""}>
        <span class="opcao__nome">${nome}</span>
        ${preco ? `<span class="opcao__preco">+${brl(preco)}</span>` : ""}
        <span class="opcao__check material-symbols-rounded">check_circle</span>
      </button>`;
  }

  function ligarGrupos(it) {
    // tamanho
    if ($("#grpTamanhos")) {
      // com um tamanho só não há escolha a fazer: já deixa marcado
      if (it.tamanhos && it.tamanhos.length === 1) {
        const unico = $("#grpTamanhos .tamanho");
        unico.classList.add("selecionado");
        estadoModal.tamanho = { rotulo: unico.dataset.rotulo, preco: parseFloat(unico.dataset.preco), limite: null };
      }
      $$("#grpTamanhos .tamanho").forEach(b => b.addEventListener("click", () => {
        $$("#grpTamanhos .tamanho").forEach(x => x.classList.remove("selecionado"));
        b.classList.add("selecionado");
        estadoModal.tamanho = { rotulo: b.dataset.rotulo, preco: parseFloat(b.dataset.preco), limite: b.dataset.limite ? parseInt(b.dataset.limite) : null };
        // ao trocar tamanho no monte, revalida limite de acompanhamentos
        if (it.tipo === "monte") aplicarLimiteAcomp();
        atualizarConfirmar();
      }));
    }
    // brinde (seleção única, sem custo)
    if ($("#grpBrinde")) selecaoUnica("#grpBrinde", (v) => { estadoModal.brinde = v; });
    // upsell (segundo copo) + brinde dele
    if ($("#grpUpsell")) {
      $$("#grpUpsell button").forEach(b => b.addEventListener("click", () => {
        $$("#grpUpsell button").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        estadoModal.upsell = b.dataset.upsell === "sim";
        $("#grpBrindeUpsellWrap").style.display = estadoModal.upsell ? "block" : "none";
        if (!estadoModal.upsell) {
          estadoModal.brindeUpsell = null;
          $$("#grpBrindeUpsell .opcao").forEach(x => x.classList.remove("selecionada"));
        }
        atualizarConfirmar();
      }));
      selecaoUnica("#grpBrindeUpsell", (v) => { estadoModal.brindeUpsell = v; });
    }
    // fruta (seleção única)
    if ($("#grpFruta")) selecaoUnica("#grpFruta", (v) => { estadoModal.fruta = v; });
    // calda (seleção única)
    if ($("#grpCalda")) selecaoUnica("#grpCalda", (v) => { estadoModal.calda = v; });
    // acompanhamentos (múltipla com limite)
    if ($("#grpAcomp")) selecaoMultipla("#grpAcomp", "acompanhamentos", "contAcomp", "avisoAcomp", () => limiteAcompAtual(it));
    // sabores combo (múltipla com limite fixo)
    if ($("#grpSabores")) selecaoMultipla("#grpSabores", "sabores", "contSabores", "avisoSabores", () => it.quantidadeSabores);
    // trio
    if ($("#grpTrio")) {
      $$("#grpTrio button").forEach(b => b.addEventListener("click", () => {
        $$("#grpTrio button").forEach(x => x.classList.remove("on"));
        b.classList.add("on");
        estadoModal.trio = b.dataset.trio === "sim";
        $("#grpBebidaWrap").style.display = estadoModal.trio ? "block" : "none";
        if (!estadoModal.trio) { estadoModal.bebidaTrio = null; $$("#grpBebida .opcao").forEach(x => x.classList.remove("selecionada")); }
        atualizarConfirmar();
      }));
      selecaoUnica("#grpBebida", (v) => { estadoModal.bebidaTrio = v; });
    }
    // sabor único (cupmaki)
    if ($("#grpSaborU")) selecaoUnica("#grpSaborU", (v) => { estadoModal.saborUnico = v; });
    // armá tu combo: rolls (1 a N) + rellenos (1 a M)
    if ($("#grpRolls")) selecaoMultipla("#grpRolls", "rolls", "contRolls", "avisoRolls", () => it.limiteRolls);
    if ($("#grpSaboresA")) selecaoMultipla("#grpSaboresA", "sabores", "contSaboresA", "avisoSaboresA", () => it.limiteSabores);
    // molhos
    if ($("#grpMolhos")) selecaoMultipla("#grpMolhos", "molhos", "contMolhos", "avisoMolhos", () => it.molhos.limite);
    // adicionais pagos (frutas/acomp dos premium + order bump)
    if ($("#grpFrutaAdd")) selecaoAdicional("#grpFrutaAdd");
    if ($("#grpAcompAdd")) selecaoAdicional("#grpAcompAdd");
    if ($("#grpAdicionais")) selecaoAdicional("#grpAdicionais");
  }

  // Multi-seleção paga sem limite: guarda {nome, preco} em estadoModal.adicionais
  function selecaoAdicional(sel) {
    $$(sel + " .opcao").forEach(b => b.addEventListener("click", () => {
      const nome = b.dataset.nome;
      const preco = parseFloat(b.dataset.preco || "0");
      const arr = estadoModal.adicionais;
      const idx = arr.findIndex(x => x.nome === nome);
      if (idx >= 0) { arr.splice(idx, 1); b.classList.remove("selecionada"); }
      else { arr.push({ nome, preco }); b.classList.add("selecionada"); }
      atualizarConfirmar();
    }));
  }

  function selecaoUnica(sel, cb) {
    $$(sel + " .opcao").forEach(b => b.addEventListener("click", () => {
      $$(sel + " .opcao").forEach(x => x.classList.remove("selecionada"));
      b.classList.add("selecionada");
      cb(b.dataset.nome);
      atualizarConfirmar();
    }));
  }

  function selecaoMultipla(sel, chave, contadorId, avisoId, limiteFn) {
    $$(sel + " .opcao").forEach(b => b.addEventListener("click", () => {
      const nome = b.dataset.nome;
      const arr = estadoModal[chave];
      const idx = arr.indexOf(nome);
      if (idx >= 0) { arr.splice(idx, 1); b.classList.remove("selecionada"); }
      else {
        const limite = limiteFn();
        if (limite != null && arr.length >= limite) { piscarAviso(avisoId); return; }
        arr.push(nome); b.classList.add("selecionada");
      }
      atualizarContador(chave, contadorId, avisoId, limiteFn());
      atualizarConfirmar();
    }));
    atualizarContador(chave, contadorId, avisoId, limiteFn());
  }

  function limiteAcompAtual(it) {
    if (it.tipo === "barca") return it.limite;
    if (it.tipo === "monte") return estadoModal.tamanho ? estadoModal.tamanho.limite : 0;
    return null;
  }

  function aplicarLimiteAcomp() {
    // ao mudar tamanho, se passou do novo limite, corta o excedente
    const it = estadoModal.item;
    const limite = limiteAcompAtual(it);
    if (limite != null && estadoModal.acompanhamentos.length > limite) {
      estadoModal.acompanhamentos = estadoModal.acompanhamentos.slice(0, limite);
      $$("#grpAcomp .opcao").forEach(b => {
        b.classList.toggle("selecionada", estadoModal.acompanhamentos.includes(b.dataset.nome));
      });
    }
    atualizarContador("acompanhamentos", "contAcomp", "avisoAcomp", limite);
  }

  function atualizarContador(chave, contadorId, avisoId, limite) {
    const cont = $("#" + contadorId);
    if (!cont) return;
    const n = estadoModal[chave].length;
    if (limite != null) {
      cont.textContent = `${n}/${limite}`;
      cont.classList.toggle("cheio", n >= limite);
      const aviso = $("#" + avisoId);
      if (aviso && n < limite) aviso.classList.remove("mostrar");
    } else {
      cont.textContent = n > 0 ? `${n} selecionados` : "";
    }
  }

  function piscarAviso(avisoId) {
    const aviso = $("#" + avisoId);
    if (aviso) { aviso.classList.add("mostrar"); }
  }

  function mudarQtdModal(delta) {
    estadoModal.qtd = Math.max(1, estadoModal.qtd + delta);
    $("#qtdValor").textContent = estadoModal.qtd;
    atualizarConfirmar();
  }

  function precoUnitModal() {
    const it = estadoModal.item;
    let p = it.preco != null ? it.preco : 0;
    if (estadoModal.tamanho) p = estadoModal.tamanho.preco;
    if (it.tipo === "hamburguer" && estadoModal.trio) p += it.trio.valor;
    if (it.upsell && estadoModal.upsell) p += it.upsell.preco;
    if (it.tipo === "armar" && it.saboresExtra) p += estadoModal.sabores.reduce((s, nm) => s + (it.saboresExtra[nm] || 0), 0);
    p += estadoModal.adicionais.reduce((s, a) => s + a.preco, 0);
    return p;
  }

  function modalCompleto() {
    const it = estadoModal.item, s = estadoModal;
    if (it.brinde && !s.brinde) return false;
    if (it.upsell && s.upsell && !s.brindeUpsell) return false;
    if (it.tipo === "acai-fixo") return !!s.tamanho && (!it.saborUnico || !!s.saborUnico);
    if (it.tipo === "armar") return !!s.tamanho && s.rolls.length >= 1 && s.sabores.length >= 1;
    if (it.tipo === "monte") return !!s.tamanho && !!s.fruta && !!s.calda;
    if (it.tipo === "barca") return !!s.fruta && !!s.calda;
    if (it.tipo === "combo") return s.sabores.length === it.quantidadeSabores;
    if (it.tipo === "hamburguer") return !s.trio || !!s.bebidaTrio;
    if (it.tipo === "baguete") return true;
    return true;
  }

  function atualizarConfirmar() {
    const btn = $("#btnConfirmar");
    if (!btn) return;
    const ok = modalCompleto();
    btn.disabled = !ok;
    $("#btnConfirmarValor").textContent = brl(precoUnitModal() * estadoModal.qtd);
  }

  function personalizacoesModal() {
    const it = estadoModal.item, s = estadoModal, p = [];
    if (s.tamanho) p.push((it.tipo === "armar" ? "Cantidad: " : "Opción: ") + s.tamanho.rotulo);
    if (s.saborUnico) p.push("Sabor: " + s.saborUnico);
    if (it.tipo === "armar") {
      if (s.rolls.length) p.push("Roll: " + s.rolls.join(", "));
      if (s.sabores.length) p.push("Relleno: " + s.sabores.join(", "));
    }
    if (it.tipo === "acai-fixo" && it.composicao) p.push("Incluye: " + it.composicao.join(", "));
    if (s.brinde) p.push("Regalo: " + s.brinde);
    if (it.upsell && s.upsell) p.push(`${it.upsell.rotulo} (+${brl(it.upsell.preco)}): ${s.brindeUpsell}`);
    if (s.fruta) p.push("Fruta: " + s.fruta);
    if (s.calda) p.push("Salsa: " + s.calda);
    if (s.acompanhamentos.length) p.push("Acompañamientos: " + s.acompanhamentos.join(", "));
    if (it.tipo === "combo" && s.sabores.length) p.push("Piezas: " + s.sabores.join(", "));
    if (it.tipo === "hamburguer") p.push(s.trio ? `Combo: Sí (${s.bebidaTrio})` : "Sin combo");
    if (it.tipo === "baguete") { p.push("Incluye ensalada especial"); p.push(s.molhos.length ? "Salsas: " + s.molhos.join(", ") : "Sin salsa"); }
    if (s.adicionais.length) p.push("Adicionales: " + s.adicionais.map(a => `${a.nome} (+${brl(a.preco)})`).join(", "));
    if (s.obs) p.push("Obs: " + s.obs);
    return p;
  }

  function confirmarModal() {
    if (!modalCompleto()) return;
    const it = estadoModal.item;
    const pers = personalizacoesModal();
    const assinatura = it.id + "|" + pers.join("|");
    const existente = carrinho.find(c => c.assinatura === assinatura);
    if (existente) existente.qtd += estadoModal.qtd;
    else carrinho.push({
      uid: uid(),
      assinatura,
      produtoId: it.id,
      nome: it.nome,
      img: it.img || null,
      emojiFallback: it.emojiFallback || "🍣",
      precoUnit: precoUnitModal(),
      qtd: estadoModal.qtd,
      personalizacoes: pers
    });
    pixel("AddToCart", {
      content_name: it.nome,
      content_ids: [it.id],
      content_type: "product",
      contents: [{ id: it.id, quantity: estadoModal.qtd }],
      value: precoUnitModal() * estadoModal.qtd,
      currency: "BOB"
    });

    salvar();
    renderCarrinho();
    fecharModal();
    toast(`${it.nome} agregado al carrito`);
    pulsarCartBar();
  }

  /* =====================================================================
     CARRINHO
     ===================================================================== */
  function totalItens() { return carrinho.reduce((s, i) => s + i.qtd, 0); }
  function subtotal() { return carrinho.reduce((s, i) => s + i.precoUnit * i.qtd, 0); }

  function renderCarrinho() {
    const n = totalItens();
    const bar = $("#cartBar");
    if (n > 0) {
      bar.classList.add("visivel");
      $("#cartBarQtd").textContent = n;
      $("#cartBarTotal").textContent = brl(subtotal());
    } else {
      bar.classList.remove("visivel");
    }
    renderDrawerItens();
    atualizarResumo();
    validarFinalizar();
  }

  function renderDrawerItens() {
    const wrap = $("#drawerItens");
    if (!carrinho.length) {
      wrap.innerHTML = `<div class="cart-vazio">
        <span class="material-symbols-rounded">shopping_cart</span>
        <p>Tu carrito está vacío.</p>
        <p style="font-size:.82rem;margin-top:6px">Elegí tus platos en el menú.</p>
      </div>`;
      $("#drawerAcoesTopo").style.display = "none";
      $("#formClienteWrap").style.display = "none";
      return;
    }
    $("#drawerAcoesTopo").style.display = "flex";
    $("#formClienteWrap").style.display = "block";
    wrap.innerHTML = "";
    carrinho.forEach(item => {
      const div = el("div", "cart-item");
      const foto = item.img
        ? `<img class="cart-item__foto" src="${item.img}" alt="${item.nome}">`
        : `<div class="cart-item__foto">${item.emojiFallback}</div>`;
      div.innerHTML = `
        ${foto}
        <div class="cart-item__info">
          <div class="cart-item__nome">${item.nome}</div>
          <div class="cart-item__pers">${item.personalizacoes.join(" · ")}</div>
          <div class="cart-item__baixo">
            <span class="cart-item__preco">${brl(item.precoUnit * item.qtd)}</span>
            <div class="cart-item__acoes">
              <div class="cart-item__qtd">
                <button aria-label="Diminuir" data-act="menos">−</button>
                <span>${item.qtd}</span>
                <button aria-label="Aumentar" data-act="mais">+</button>
              </div>
              <button class="cart-item__remover material-symbols-rounded" aria-label="Remover" data-act="remover">delete</button>
            </div>
          </div>
        </div>`;
      $("[data-act=menos]", div).addEventListener("click", () => mudarQtdItem(item.uid, -1));
      $("[data-act=mais]", div).addEventListener("click", () => mudarQtdItem(item.uid, 1));
      $("[data-act=remover]", div).addEventListener("click", () => removerItem(item.uid));
      wrap.appendChild(div);
    });
  }

  function mudarQtdItem(uidItem, delta) {
    const item = carrinho.find(i => i.uid === uidItem);
    if (!item) return;
    item.qtd += delta;
    if (item.qtd <= 0) carrinho = carrinho.filter(i => i.uid !== uidItem);
    salvar();
    renderCarrinho();
  }

  function removerItem(uidItem) {
    carrinho = carrinho.filter(i => i.uid !== uidItem);
    salvar();
    renderCarrinho();
    toast("Ítem eliminado");
  }

  function limparCarrinho() {
    if (!carrinho.length) return;
    carrinho = [];
    salvar();
    renderCarrinho();
    toast("Carrito vaciado");
  }

  /* ---------------- Drawer abrir/fechar ---------------- */
  function abrirDrawer() { $("#drawerOverlay").classList.add("aberto"); $("#drawer").classList.add("aberto"); document.body.style.overflow = "hidden"; }
  function fecharDrawer() { $("#drawerOverlay").classList.remove("aberto"); $("#drawer").classList.remove("aberto"); document.body.style.overflow = ""; }

  /* =====================================================================
     FRETE
     ===================================================================== */
  function faixaFrete(km) {
    for (const f of FRETE.faixas) if (km <= f.ate) return f.valor;
    return null; // fora de área
  }

  // Extrai lat,lng de vários formatos de link do Google Maps
  function parseCoordsLink(link) {
    if (!link) return null;
    const m =
      link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      link.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
      link.match(/(-?\d{1,2}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})/);
    return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null;
  }

  // Distância em linha reta (km) entre dois pontos
  function haversineKm(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  function aplicarFrete(km, estimado) {
    const valor = faixaFrete(km);
    if (valor == null) frete = { status: "fora", valor: null, distanciaKm: km, estimado };
    else frete = { status: "ok", valor, distanciaKm: km, estimado };
    atualizarResumo(); validarFinalizar();
  }

  // Estimativa sem chave: coordenadas do link x distância em linha reta x fator de rota
  function estimarPorCoords() {
    const coords = parseCoordsLink($("#cliMaps").value.trim());
    if (!coords) { frete = { status: "consultar", valor: null, distanciaKm: null, estimado: false }; atualizarResumo(); validarFinalizar(); return; }
    const km = haversineKm(LOJA.coordenadas, coords) * (FRETE.fatorRota || 1.3);
    aplicarFrete(km, true);
  }

  // Calcula o frete. Com chave do Maps -> rota exata. Sem chave -> estimativa por coordenadas.
  async function calcularFrete() {
    const link = $("#cliMaps").value.trim();
    if (FRETE.googleMapsApiKey && link) {
      try {
        const destino = await extrairDestino(link);
        const km = await distanciaPorRota(LOJA.coordenadas, destino);
        aplicarFrete(km, false);
      } catch (e) {
        estimarPorCoords();
      }
      return;
    }
    estimarPorCoords();
  }

  // Botão "Enviar minha localização atual" (GPS do aparelho, sem chave do Maps)
  function usarMinhaLocalizacao() {
    const btn = $("#btnLocalizacao"), status = $("#locStatus"), txt = $("#btnLocalizacaoTxt");
    if (!navigator.geolocation) {
      status.className = "loc-status erro mostrar";
      status.innerHTML = `<span class="material-symbols-rounded">error</span><span>Tu dispositivo no permite ubicación. Pegá el link de Google Maps abajo.</span>`;
      return;
    }
    btn.disabled = true; txt.textContent = "Obteniendo ubicación...";
    status.className = "loc-status carregando mostrar";
    status.innerHTML = `<span class="material-symbols-rounded">my_location</span><span>Buscando tu ubicación...</span>`;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      $("#cliMaps").value = `https://www.google.com/maps?q=${latitude},${longitude}`;
      btn.disabled = false; txt.textContent = "Actualizar mi ubicación";
      estimarPorCoords();
      const dist = frete.distanciaKm != null ? ` (aprox. ${frete.distanciaKm.toFixed(1)} km)` : "";
      if (frete.status === "fora") {
        status.className = "loc-status erro mostrar";
        status.innerHTML = `<span class="material-symbols-rounded">wrong_location</span><span>Estás fuera del área de entrega${dist}.</span>`;
      } else {
        status.className = "loc-status ok mostrar";
        status.innerHTML = `<span class="material-symbols-rounded">check_circle</span><span>Ubicación recibida${dist}. Mirá la tarifa en el resumen de abajo.</span>`;
      }
      validarFinalizar();
    }, (err) => {
      btn.disabled = false; txt.textContent = "Enviar mi ubicación actual";
      status.className = "loc-status erro mostrar";
      const msg = err.code === 1
        ? "Permiso de ubicación denegado. Autorizá en el navegador o pegá el link de Google Maps abajo."
        : "No pudimos obtener tu ubicación. Pegá el link de Google Maps abajo.";
      status.innerHTML = `<span class="material-symbols-rounded">error</span><span>${msg}</span>`;
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  }

  // --- Integração Google Maps (só roda quando há chave) ---
  function extrairDestino(link) {
    // tenta extrair lat,lng do link; senão geocoda o endereço digitado
    const m = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || link.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return Promise.resolve({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) });
    const enderecoTexto = [$("#cliRua").value, $("#cliNumero").value, $("#cliBairro").value, $("#cliCidade").value].filter(Boolean).join(", ");
    return new Promise((res, rej) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: enderecoTexto }, (r, status) => {
        if (status === "OK" && r[0]) { const l = r[0].geometry.location; res({ lat: l.lat(), lng: l.lng() }); }
        else rej(status);
      });
    });
  }

  function distanciaPorRota(origem, destino) {
    return new Promise((res, rej) => {
      const svc = new google.maps.DistanceMatrixService();
      svc.getDistanceMatrix({
        origins: [new google.maps.LatLng(origem.lat, origem.lng)],
        destinations: [new google.maps.LatLng(destino.lat, destino.lng)],
        travelMode: google.maps.TravelMode.DRIVING
      }, (resp, status) => {
        if (status === "OK" && resp.rows[0].elements[0].status === "OK") {
          res(resp.rows[0].elements[0].distance.value / 1000);
        } else rej(status);
      });
    });
  }

  function carregarGoogleMaps() {
    if (!FRETE.googleMapsApiKey || window.google) return;
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${FRETE.googleMapsApiKey}&libraries=places`;
    s.async = true; s.defer = true;
    s.onload = ativarAutocomplete;
    document.head.appendChild(s);
  }

  function ativarAutocomplete() {
    if (!window.google || !google.maps.places) return;
    const ac = new google.maps.places.Autocomplete($("#cliBuscaEndereco"), { componentRestrictions: { country: "br" }, fields: ["geometry", "formatted_address"] });
    ac.addListener("place_changed", () => {
      const p = ac.getPlace();
      if (p.geometry) {
        const l = p.geometry.location;
        $("#cliMaps").value = `https://maps.google.com/?q=${l.lat()},${l.lng()}`;
        calcularFrete();
      }
    });
    $("#buscaEnderecoWrap").style.display = "block";
  }

  /* =====================================================================
     RESUMO DO PEDIDO
     ===================================================================== */
  function atualizarResumo() {
    const sub = subtotal();
    $("#resSubtotal").textContent = brl(sub);
    const avisoFrete = $("#avisoFrete");
    let taxaTxt, totalTxt;
    if (frete.status === "ok") {
      taxaTxt = frete.valor === 0 ? "Gratis" : brl(frete.valor);
      totalTxt = brl(sub + frete.valor);
      if (frete.estimado) {
        avisoFrete.className = "aviso-frete info mostrar";
        avisoFrete.innerHTML = `<span class="material-symbols-rounded" style="font-size:18px">info</span><span>Tarifa estimada por la distancia. La tienda confirma el valor final por WhatsApp.</span>`;
      } else {
        avisoFrete.className = "aviso-frete";
      }
    } else if (frete.status === "fora") {
      taxaTxt = "Fuera del área";
      totalTxt = brl(sub);
      avisoFrete.className = "aviso-frete erro mostrar";
      avisoFrete.innerHTML = `<span class="material-symbols-rounded" style="font-size:18px">error</span><span>${FRETE.msgForaDeArea}</span>`;
    } else {
      taxaTxt = "A consultar";
      totalTxt = brl(sub);
      avisoFrete.className = "aviso-frete info mostrar";
      avisoFrete.innerHTML = `<span class="material-symbols-rounded" style="font-size:18px">info</span><span>Enviá tu ubicación arriba para calcular la tarifa de envío al instante.</span>`;
    }
    $("#resTaxa").textContent = taxaTxt;
    $("#resTotal").textContent = totalTxt;
    $("#resDistLinha").style.display = frete.distanciaKm != null ? "flex" : "none";
    if (frete.distanciaKm != null) $("#resDist").textContent = (frete.estimado ? "aprox. " : "") + frete.distanciaKm.toFixed(1) + " km";
  }

  /* =====================================================================
     FORMULÁRIO DO CLIENTE + VALIDAÇÃO
     ===================================================================== */
  function initForm() {
    // pagamento
    $$(".pag-op").forEach(b => b.addEventListener("click", () => {
      $$(".pag-op").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      $("#formCliente").dataset.pag = b.dataset.pag;
      $("#trocoWrap").style.display = b.dataset.pag === "Efectivo" ? "block" : "none";
      if (b.dataset.pag !== "Efectivo") { $("#precisaTroco").value = "nao"; $("#trocoValorWrap").style.display = "none"; }
      limparErro($("#pagamentos").closest(".campo"));
      validarFinalizar();
    }));
    // troco
    $("#precisaTroco").addEventListener("change", e => {
      $("#trocoValorWrap").style.display = e.target.value === "sim" ? "block" : "none";
      validarFinalizar();
    });
    // botão de localização (GPS)
    $("#btnLocalizacao").addEventListener("click", usarMinhaLocalizacao);
    // recalcular frete ao digitar/colar o link do maps
    $("#cliMaps").addEventListener("input", calcularFrete);
    ["cliRua", "cliNumero", "cliBairro", "cliCidade"].forEach(id => {
      $("#" + id).addEventListener("input", () => { validarFinalizar(); });
    });
    // validação em tempo real
    $$("#formCliente input, #formCliente select, #formCliente textarea").forEach(c => {
      c.addEventListener("input", validarFinalizar);
    });
    $("#btnFinalizar").addEventListener("click", finalizarPedido);
    // se houver chave, ativa Google Maps
    carregarGoogleMaps();
  }

  function limparErro(campo) { if (campo) campo.classList.remove("erro"); }

  function validarFinalizar() {
    const btn = $("#btnFinalizar");
    if (!btn) return true;
    let ok = carrinho.length > 0;
    const req = ["cliNome", "cliSobrenome", "cliRua", "cliNumero", "cliBairro", "cliCidade", "cliMaps"];
    req.forEach(id => { if (!$("#" + id).value.trim()) ok = false; });
    if (!$("#formCliente").dataset.pag) ok = false;
    if ($("#formCliente").dataset.pag === "Efectivo" && $("#precisaTroco").value === "sim" && !$("#cliTroco").value.trim()) ok = false;
    if (frete.status === "fora") ok = false;
    btn.disabled = !ok;
    return ok;
  }

  function marcarErros() {
    const mapa = { cliNome: "#campoNome", cliSobrenome: "#campoSobrenome", cliRua: "#campoRua", cliNumero: "#campoNumero", cliBairro: "#campoBairro", cliCidade: "#campoCidade", cliMaps: "#campoMaps" };
    Object.entries(mapa).forEach(([id, campo]) => {
      const c = $(campo);
      if (!$("#" + id).value.trim()) c.classList.add("erro"); else c.classList.remove("erro");
    });
    if (!$("#formCliente").dataset.pag) $("#campoPagamento").classList.add("erro"); else $("#campoPagamento").classList.remove("erro");
    if ($("#formCliente").dataset.pag === "Efectivo" && $("#precisaTroco").value === "sim" && !$("#cliTroco").value.trim())
      $("#campoTroco").classList.add("erro"); else $("#campoTroco").classList.remove("erro");
  }

  /* =====================================================================
     MENSAGEM DO WHATSAPP
     ===================================================================== */
  function montarMensagem() {
    const nome = $("#cliNome").value.trim();
    const sobrenome = $("#cliSobrenome").value.trim();
    const pag = $("#formCliente").dataset.pag || "";
    const linha = "━━━━━━━━━━━━━━━━━━━━";
    const sep = "----------------------------";

    let troco = "No necesita";
    if (pag === "Efectivo" && $("#precisaTroco").value === "sim") {
      const v = $("#cliTroco").value.trim();
      troco = v ? "Vuelto para Bs " + v : "Sí";
    }

    let m = "🍣 NUEVO PEDIDO · JAPA SUSHI CBBA\n" + linha + "\n\n";
    m += "👤 Cliente:\n" + nome + " " + sobrenome + "\n\n";
    m += "💳 Forma de pago:\n" + pag + "\n\n";
    m += "💰 Vuelto:\n" + troco + "\n\n";
    m += "📍 Dirección:\n\n";
    m += "Calle: " + $("#cliRua").value.trim() + "\n";
    m += "Número: " + $("#cliNumero").value.trim() + "\n";
    m += "Referencia: " + ($("#cliComplemento").value.trim() || "-") + "\n";
    m += "Zona/Barrio: " + $("#cliBairro").value.trim() + "\n";
    m += "Ciudad: " + $("#cliCidade").value.trim() + "\n";
    const cep = $("#cliCep").value.trim();
    if (cep) m += "Código postal: " + cep + "\n";
    m += "\n🗺 Ubicación:\n" + $("#cliMaps").value.trim() + "\n";
    if (frete.distanciaKm != null) m += "\n📏 Distancia:\n" + (frete.estimado ? "aprox. " : "") + frete.distanciaKm.toFixed(1) + " km\n";
    m += "\n" + linha + "\n\n🛒 PEDIDO\n\n";

    carrinho.forEach((item, i) => {
      m += "• " + item.nome + "\n";
      m += "Cantidad: " + item.qtd + "\n";
      const pers = item.personalizacoes.filter(p => !p.startsWith("Incluye:"));
      m += "Detalles: " + (pers.length ? pers.join("; ") : "-") + "\n";
      m += "Valor: " + brl(item.precoUnit * item.qtd) + "\n";
      if (i < carrinho.length - 1) m += sep + "\n\n";
    });

    const sub = subtotal();
    let taxa = "A consultar";
    let total = brl(sub) + " + envío a consultar";
    if (frete.status === "ok") {
      taxa = (frete.valor === 0 ? "Gratis" : brl(frete.valor)) + (frete.estimado ? " (estimada, a confirmar)" : "");
      total = brl(sub + frete.valor) + (frete.estimado ? " (con envío estimado)" : "");
    }

    m += "\n" + linha + "\n\n";
    m += "Subtotal:\n" + brl(sub) + "\n\n";
    m += "🚚 Envío:\n" + taxa + "\n\n";
    m += "TOTAL:\n" + total + "\n\n";
    m += linha + "\n\n";
    const obs = $("#cliObs").value.trim();
    m += "📝 Observaciones:\n" + (obs || "-") + "\n\n";
    m += "¡Gracias por tu preferencia!";
    return m;
  }

  function finalizarPedido() {
    if (!validarFinalizar()) {
      marcarErros();
      if (frete.status === "fora") toast("Dirección fuera del área de entrega");
      else toast("Completá los campos obligatorios");
      // rola até o primeiro erro
      const primeiro = $(".campo.erro");
      if (primeiro) primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // Evento mais perto de uma venda que dá pra medir: a compra em si fecha
    // no WhatsApp, fora do site, e o pixel não enxerga lá.
    pixel("InitiateCheckout", {
      content_ids: carrinho.map(i => i.produtoId),
      contents: carrinho.map(i => ({ id: i.produtoId, quantity: i.qtd })),
      num_items: totalItens(),
      value: subtotal() + (frete.status === "ok" ? frete.valor : 0),
      currency: "BOB"
    });

    const msg = montarMensagem();
    const url = `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(msg)}`;

    toast("Abriendo WhatsApp con tu pedido...");
    abrirWhatsApp(url);
  }

  // Entrega o pedido no WhatsApp de forma confiável no celular e no desktop.
  // 1) tenta um clique real em <a target="_blank"> (mantém o gesto do usuário);
  // 2) se o pop-up for bloqueado, cai para a navegação na mesma aba.
  function abrirWhatsApp(url) {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Fallback: se a aba nova não abriu (bloqueada), abre na mesma aba.
      setTimeout(() => {
        if (!document.hidden) window.location.href = url;
      }, 900);
    } catch (e) {
      window.location.href = url;
    }
  }

  /* =====================================================================
     UI: toast, scroll spy, back to top, reveal, skeleton
     ===================================================================== */
  let toastTimer;
  function toast(txt) {
    const wrap = $("#toastWrap");
    const t = el("div", "toast", `<span class="material-symbols-rounded">check_circle</span> ${txt}`);
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 2200);
  }

  function pulsarCartBar() {
    const bar = $("#cartBar .cart-bar__inner");
    bar.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: 300 });
  }

  function initScrollSpy() {
    const cats = CATEGORIAS.map(c => $("#cat-" + c.id));
    window.addEventListener("scroll", () => {
      const y = window.scrollY + 140;
      let ativo = 0;
      cats.forEach((sec, i) => { if (sec && sec.offsetTop <= y) ativo = i; });
      $$("#navCatsInner button").forEach((b, i) => b.classList.toggle("ativo", i === ativo));
      const btnTopo = $("#fabTopo");
      btnTopo.classList.toggle("visivel", window.scrollY > 500);
      // mantém o botão ativo visível na nav horizontal
      const btnAtivo = $$("#navCatsInner button")[ativo];
      if (btnAtivo) btnAtivo.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }, { passive: true });
  }

  let revealObs;
  function ativarReveal() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach(e => e.classList.add("visivel")); return; }
    if (revealObs) revealObs.disconnect();
    revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visivel"); revealObs.unobserve(e.target); } });
    }, { threshold: 0.08 });
    $$(".reveal").forEach(e => revealObs.observe(e));
  }

  // As categorias só existem depois do skeleton, então a âncora do link
  // (ex: /#cat-promocao, usada nos anúncios) é aplicada aqui, na mão.
  // Salto direto, sem animação: quem chega pelo link quer ver a seção na hora,
  // e o scroll suave no load é cancelado pelo navegador quando as fotos carregam.
  function irParaAncora() {
    const id = (location.hash || "").replace("#", "");
    if (!id) return;
    const alvo = document.getElementById(id);
    if (!alvo) return;
    const y = alvo.getBoundingClientRect().top + window.scrollY - 116;
    window.scrollTo({ top: y, behavior: "instant" });
  }

  /* =====================================================================
     INICIALIZAÇÃO
     ===================================================================== */
  function init() {
    carregar();
    renderCabecalho();
    renderStatusLoja();
    setInterval(renderStatusLoja, 60000);
    renderNavCats();
    renderDestaques();

    // skeleton curto (sensação de carregamento elegante)
    setTimeout(() => {
      $("#skeleton").style.display = "none";
      renderCategorias();
      initBusca();
      initScrollSpy();
      renderCarrinho();
      irParaAncora();
    }, 350);

    initForm();

    // eventos de carrinho
    $("#cartBar").addEventListener("click", abrirDrawer);
    $("#drawerFechar").addEventListener("click", fecharDrawer);
    $("#drawerOverlay").addEventListener("click", fecharDrawer);
    $("#btnContinuar").addEventListener("click", fecharDrawer);
    $("#btnLimpar").addEventListener("click", limparCarrinho);
    $("#modalOverlay").addEventListener("click", (e) => { if (e.target.id === "modalOverlay") fecharModal(); });
    $("#fabTopo").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // service worker (PWA)
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
