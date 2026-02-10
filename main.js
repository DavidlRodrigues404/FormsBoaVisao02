
    // =========================================================================
    // URL DO SCRIPT
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyJJnEGn75pTWhX8ZBtkjogdQ-hJoQcbW4UCuR04yj-t96olsXB5PvB8kG3t2hoZ2mlAA/exec'; 
    // =========================================================================

    const maxVagas = 100; // 100 por período = 200 total
    const form = document.forms['submit-to-google-sheet'];
    const btn = document.getElementById('btnEnviar');
    const selectEstado = document.getElementById('estado');
    const selectCidade = document.getElementById('cidade');

    function showToast(message, type = 'error') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<div>${type === 'error' ? '⚠️' : '✅'}</div><div><strong>${type === 'error' ? 'Atenção' : 'Sucesso'}</strong><br>${message}</div>`;
        container.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
    }

    window.selectOption = function(id) {
        document.querySelectorAll('.agenda-option').forEach(el => el.classList.remove('selected'));
        const selected = document.getElementById(`opt-${id}`);
        if (!selected.querySelector('input').disabled) selected.classList.add('selected');
    }

    document.getElementById('nome').addEventListener('blur', function() {
        let words = this.value.toLowerCase().split(' ');
        for (let i = 0; i < words.length; i++) words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        this.value = words.join(' ');
    });

    const dateInput = document.getElementById('nascimento');
    const today = new Date(); dateInput.max = today.toISOString().split("T")[0];
    const minDate = new Date(); minDate.setFullYear(today.getFullYear() - 110); dateInput.min = minDate.toISOString().split("T")[0];

    // IBGE API
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(r=>r.json()).then(e=>{
        selectEstado.innerHTML='<option value="">Selecione...</option>';e.forEach(x=>{let o=document.createElement('option');o.value=x.sigla;o.textContent=x.nome;selectEstado.appendChild(o)});
    });
    selectEstado.addEventListener('change', () => {
        const uf = selectEstado.value;
        if (!uf) { selectCidade.innerHTML = '<option value="">Selecione UF...</option>'; selectCidade.disabled = true; return; }
        selectCidade.innerHTML = '<option value="">Carregando...</option>';
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`).then(r=>r.json()).then(c=>{
            selectCidade.innerHTML = '<option value="">Selecione a Cidade</option>'; selectCidade.disabled = false;
            c.forEach(x=>{let o=document.createElement('option');o.value=x.nome;o.textContent=x.nome;selectCidade.appendChild(o)});
        });
    });

    // MÁSCARAS E VALIDAÇÕES (Apenas Números)
    
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf == '' || cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let add = 0; for (let i=0; i<9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11); if (rev == 10 || rev == 11) rev = 0;
        if (rev != parseInt(cpf.charAt(9))) return false;
        add = 0; for (let i=0; i<10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11); if (rev == 10 || rev == 11) rev = 0;
        if (rev != parseInt(cpf.charAt(10))) return false;
        return true;
    }

    // CPF
    document.getElementById('cpf').addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g, ''); 
        e.target.value = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        this.classList.remove('input-error'); document.getElementById('cpfError').style.display='none';
    });

    // RG (NOVA MÁSCARA - APENAS NÚMEROS)
    document.getElementById('rg').addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, ''); 
    });

    // WHATSAPP
    document.getElementById('whatsapp').addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g, ''); 
        v = v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3"); 
        e.target.value = v;
    });

    // CÁLCULO DE IDADE (6 a 110 anos)
    const inputIdade = document.getElementById('idade');
    const msgIdade = document.getElementById('msgIdade');
    dateInput.addEventListener('change', function() {
        if(!this.value) return;
        const h = new Date(); const n = new Date(this.value);
        let id = h.getFullYear() - n.getFullYear();
        if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) id--;
        inputIdade.value = id;
        
        if(id < 6 || id > 110) {
            msgIdade.style.display = 'block'; msgIdade.innerHTML = `🚫 Idade permitida: 6 a 110 anos. (Paciente tem ${id})`;
            this.classList.add('input-error'); btn.disabled = true;
        } else {
            msgIdade.style.display = 'none'; this.classList.remove('input-error'); btn.disabled = false;
        }
    });

    // CARREGAR VAGAS
    const opcoes = [
        { id: '1', val: 'Sábado 28/02 - Manhã', desc: 'Até 09:30' }, 
        { id: '2', val: 'Sábado 28/02 - Tarde', desc: 'Até 14:30' }
    ];

    window.addEventListener('load', () => {
        fetch(scriptURL).then(res => res.json()).then(data => {
            document.getElementById('status-vagas').style.display = 'none';
            opcoes.forEach(op => {
                const ocup = data[op.val] || 0; const rest = maxVagas - ocup;
                const txt = document.getElementById(`vagas-${op.id}`); const card = document.getElementById(`opt-${op.id}`); const radio = card.querySelector('input');
                if(rest <= 0) {
                    txt.innerHTML = `🚫 <span style="color:red; font-weight:bold;">ESGOTADO</span>`;
                    radio.disabled = true; card.style.opacity = "0.5"; card.style.background = "#e9ecef"; card.style.cursor = "not-allowed";
                } else {
                    const cor = rest > 20 ? '#198754' : '#fd7e14';
                    txt.innerHTML = `<span>${op.desc}</span> • <span style="color:${cor}; font-weight:bold;">${rest} vagas</span>`;
                }
            });
        }).catch(() => { document.getElementById('status-vagas').innerHTML = "⚠️ Erro ao carregar vagas."; showToast("Erro de conexão."); });
    });

    // ENVIO
    form.addEventListener('submit', e => {
        e.preventDefault();
        
        if (document.getElementById('honeypot').value !== "") return;

        document.getElementById('nome').value = document.getElementById('nome').value.trim();
        const cpfVal = document.getElementById('cpf').value;
        if (!validarCPF(cpfVal)) { showToast("CPF inválido. Verifique os números."); document.getElementById('cpf').classList.add('input-error'); return; }
        const idNum = parseInt(inputIdade.value);
        if(isNaN(idNum) || idNum < 6 || idNum > 110) { showToast("Idade deve ser entre 6 e 110 anos."); return; }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-sm" style="border-top-color: white; width: 15px; height: 15px;"></span> Confirmando...';

        fetch(scriptURL, { method: 'POST', body: new FormData(form)}).then(r => r.json()).then(res => {
            if (res.result === 'error' && res.message === 'CPF_DUPLICADO') {
                showToast("Ops! Este CPF já está cadastrado.", "error");
                const cpfInput = document.getElementById('cpf');
                cpfInput.classList.add('input-error');
                cpfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.getElementById('cpfError').style.display = 'block';
                btn.disabled = false; btn.innerHTML = "Confirmar Agendamento";
            } else if (res.result === 'success') {
                // Configurar Botão Agenda
                const opcaoSelecionada = document.querySelector('input[name="agendamento"]:checked').value;
                let horaInicio = '080000'; let horaFim = '120000';
                if (opcaoSelecionada.includes('Tarde')) { horaInicio = '130000'; horaFim = '170000'; }
                
                const titulo = encodeURIComponent("Oftalmologista - Uma Boa Visão Transforma Vidas");
                const detalhes = encodeURIComponent("Local: Bariri - SP. Levar documentos pessoais.");
                const dataEvento = "20260228"; // Data YYYYMMDD
                
                const linkGoogle = `https://www.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${dataEvento}T${horaInicio}/${dataEvento}T${horaFim}&details=${detalhes}`;
                document.getElementById('btnAgenda').href = linkGoogle;

                document.getElementById('modalSucesso').style.display = 'flex';
            } else { throw new Error(res.error); }
        }).catch(err => { console.error(err); showToast("Erro de conexão."); btn.disabled = false; btn.innerHTML = "Confirmar Agendamento"; });
    });