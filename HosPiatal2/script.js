document.addEventListener('DOMContentLoaded', function() {
    const idadeInput = document.getElementById('idade');
    const gerarSenhaBtn = document.getElementById('gerarSenha');
    const gerarPreferencialBtn = document.getElementById('gerarPreferencial');
    const resultadoDiv = document.getElementById('resultado');
    const senhaGeradaP = document.getElementById('senhaGerada');

    let senhaCounter = parseInt(localStorage.getItem('senhaCounter') || '1');

    // Load existing passwords
    let senhas = JSON.parse(localStorage.getItem('senhas') || '[]');

    idadeInput.addEventListener('input', function() {
        if (parseInt(this.value) > 60) {
            gerarPreferencialBtn.style.display = 'inline-block';
        } else {
            gerarPreferencialBtn.style.display = 'none';
        }
    });

    function validarFormulario() {
        const campos = ['nome', 'rg', 'idade', 'sus', 'cpf', 'telefone', 'sexo', 'especialidade'];
        for (let campo of campos) {
            const elemento = document.getElementById(campo);
            if (!elemento.value.trim()) {
                alert(`Por favor, preencha o campo ${campo}.`);
                elemento.focus();
                return false;
            }
        }
        return true;
    }

    function redirecionarPorEspecialidade(especialidade) {
        if (especialidade === 'pediatria') {
            window.location.href = 'Pediatria.html';
        } else if (especialidade === 'ortopedia') {
            window.location.href = 'Ortopedia.html';
        } else if (especialidade === 'cardiologia') {
            window.location.href = 'Cardiologia.html';
        } else {
            alert('Sala para esta especialidade não implementada ainda.');
        }
    }

    async function saveTriageData(triagem) {
        try {
            const response = await fetch('http://localhost:3000/api/triage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(triagem),
            });
            if (!response.ok) {
                throw new Error('Failed to save triage data');
            }
            const result = await response.json();
            console.log('Triage saved:', result);
        } catch (error) {
            console.error('Error saving triage:', error);
            alert('Erro ao salvar dados da triagem. Verifique se o servidor está rodando.');
        }
    }

    gerarSenhaBtn.addEventListener('click', async function() {
        if (!validarFormulario()) return;
        const especialidade = document.getElementById('especialidade').value;
        const senha = 'S-' + senhaCounter++;
        const timestamp = Date.now();

        // Save triage data
        const triagem = {
            senha,
            nome: document.getElementById('nome').value,
            rg: document.getElementById('rg').value,
            cpf: document.getElementById('cpf').value,
            idade: document.getElementById('idade').value,
            sus: document.getElementById('sus').value,
            telefone: document.getElementById('telefone').value,
            sexo: document.getElementById('sexo').value,
            especialidade,
            sintomas: document.getElementById('sintomas').value,
            timestamp,
            status: 'pendente'
        };

        // Save to database
        await saveTriageData(triagem);

        // Keep localStorage for backward compatibility and local counters
        let triagens = JSON.parse(localStorage.getItem('triagens') || '[]');
        triagens.push(triagem);
        localStorage.setItem('triagens', JSON.stringify(triagens));

        senhas.push({senha, timestamp});
        localStorage.setItem('senhas', JSON.stringify(senhas));
        localStorage.setItem('senhaCounter', senhaCounter.toString());
        senhaGeradaP.textContent = senha;
        resultadoDiv.style.display = 'block';
        // Reset form to allow generating password for another patient
        document.getElementById('triagemForm').reset();
        // Removed redirection to doctor's room to only send patient information
        // setTimeout(() => redirecionarPorEspecialidade(especialidade), 2000); // Delay for user to see password
    });

    gerarPreferencialBtn.addEventListener('click', async function() {
        if (!validarFormulario()) return;
        const especialidade = document.getElementById('especialidade').value;
        const senha = 'P-' + senhaCounter++;
        const timestamp = Date.now();

        // Save triage data
        const triagem = {
            senha,
            nome: document.getElementById('nome').value,
            rg: document.getElementById('rg').value,
            cpf: document.getElementById('cpf').value,
            idade: document.getElementById('idade').value,
            sus: document.getElementById('sus').value,
            telefone: document.getElementById('telefone').value,
            sexo: document.getElementById('sexo').value,
            especialidade,
            sintomas: document.getElementById('sintomas').value,
            timestamp,
            status: 'pendente'
        };

        // Save to database
        await saveTriageData(triagem);

        // Keep localStorage for backward compatibility and local counters
        let triagens = JSON.parse(localStorage.getItem('triagens') || '[]');
        triagens.push(triagem);
        localStorage.setItem('triagens', JSON.stringify(triagens));

        senhas.push({senha, timestamp});
        localStorage.setItem('senhas', JSON.stringify(senhas));
        localStorage.setItem('senhaCounter', senhaCounter.toString());
        senhaGeradaP.textContent = senha;
        resultadoDiv.style.display = 'block';
        // Reset form to allow generating password for another patient
        document.getElementById('triagemForm').reset();
        // Removed redirection to doctor's room to only send patient information
        // setTimeout(() => redirecionarPorEspecialidade(especialidade), 2000);
    });

    // New function to clear all patient data
    window.clearAllPatientData = function() {
        localStorage.removeItem('triagens');
        localStorage.removeItem('senhas');
        localStorage.removeItem('senhaCounter');
        localStorage.removeItem('registrosPediatria');
        localStorage.removeItem('registrosOrtopedia');
        localStorage.removeItem('prontuario');
        alert('Todos os dados dos pacientes foram apagados.');
    };
});
