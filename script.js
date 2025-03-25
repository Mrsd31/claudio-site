document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const patientForm = document.getElementById('patientForm');
    const patientsList = document.getElementById('patientsList');
    const removeSelectedBtn = document.getElementById('removeSelected');
    const exportExcelBtn = document.getElementById('exportExcel');
    const exportPDFBtn = document.getElementById('exportPDF');

    // Inicializa os datepickers
    flatpickr("#birthDate", {
        dateFormat: "d/m/Y",
        locale: "pt"
    });
    
    flatpickr("#exitDate", {
        dateFormat: "d/m/Y",
        locale: "pt"
    });
    
    flatpickr("#entryTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        locale: "pt"
    });
    
    flatpickr("#exitTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        locale: "pt"
    });

    // Carrega pacientes ao iniciar
    loadPatients();

    // Evento de submit do formulário
    patientForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addPatient();
    });

    // Evento para remover selecionados
    removeSelectedBtn.addEventListener('click', removeSelectedPatients);

    // Evento para exportar Excel
    exportExcelBtn.addEventListener('click', exportToExcel);

    // Evento para exportar PDF
    exportPDFBtn.addEventListener('click', exportToPDF);

    // Função para adicionar paciente
    function addPatient() {
        const birthDate = document.getElementById('birthDate').value;
        
        const patient = {
            id: Date.now(),
            name: document.getElementById('name').value,
            motherName: document.getElementById('motherName').value,
            birthDate: birthDate,
            entryTime: document.getElementById('entryTime').value,
            exitTime: document.getElementById('exitTime').value || null,
            exitDate: document.getElementById('exitDate').value || null,
            address: document.getElementById('address').value,
            complement: document.getElementById('complement').value || null,
            contacts: document.getElementById('contacts').value,
            category: document.getElementById('category').value,
            notes: document.getElementById('notes').value || null,
            age: calculateAge(birthDate) // Calcula a idade aqui
        };

        // Processa a foto se existir
        const photoInput = document.getElementById('photo');
        if (photoInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                patient.photo = e.target.result;
                savePatient(patient);
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            savePatient(patient);
        }
    }

    // Função para calcular idade
    function calculateAge(birthDate) {
        if (!birthDate) return null;
        
        try {
            // Converte de DD/MM/YYYY para partes de data
            const [day, month, year] = birthDate.split('/');
            
            // Cria objetos de data
            const birthDateObj = new Date(year, month - 1, day);
            const today = new Date();
            
            // Calcula diferença de anos
            let age = today.getFullYear() - birthDateObj.getFullYear();
            const monthDiff = today.getMonth() - birthDateObj.getMonth();
            
            // Ajusta se ainda não fez aniversário este ano
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }
            
            return age;
        } catch (e) {
            console.error('Erro ao calcular idade:', e);
            return null;
        }
    }

    // Função para salvar paciente no localStorage
    function savePatient(patient) {
        try {
            let patients = getPatientsFromStorage();
            patients.push(patient);
            localStorage.setItem('patients', JSON.stringify(patients));
            loadPatients();
            patientForm.reset();
            showAlert('Paciente cadastrado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar paciente:', error);
            showAlert('Erro ao salvar paciente', 'danger');
        }
    }

    // Função para carregar pacientes
    function loadPatients() {
        try {
            const patients = getPatientsFromStorage();
            patientsList.innerHTML = '';

            if (patients.length === 0) {
                patientsList.innerHTML = '<p class="text-center">Nenhum paciente cadastrado ainda.</p>';
                removeSelectedBtn.disabled = true;
                return;
            }

            patients.forEach(patient => {
                const patientCard = createPatientCard(patient);
                patientsList.appendChild(patientCard);
            });

            // Adiciona eventos aos botões de remoção
            document.querySelectorAll('.remove-btn').forEach(button => {
                button.addEventListener('click', function() {
                    removePatient(parseInt(this.dataset.id));
                });
            });

            // Adiciona eventos aos checkboxes
            document.querySelectorAll('.patient-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', updateRemoveSelectedButton);
            });

        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
            patientsList.innerHTML = '<p class="text-center text-danger">Erro ao carregar pacientes</p>';
        }
    }

    // Função para criar o card do paciente
    function createPatientCard(patient) {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        
        // Processa os dados garantindo valores padrão
        const getValue = (value, defaultValue = '') => value || defaultValue;
        const ageText = patient.age !== null && patient.age !== undefined ? `${patient.age} anos` : 'N/A';
        
        card.innerHTML = `
            <div class="patient-card h-100">
                <input type="checkbox" class="form-check-input patient-checkbox" data-id="${patient.id}">
                ${patient.photo 
                    ? `<img src="${patient.photo}" class="patient-photo" alt="${getValue(patient.name, 'Paciente')}">` 
                    : '<div class="patient-photo bg-light d-flex align-items-center justify-content-center"><i class="fas fa-user fa-5x text-secondary"></i></div>'}
                <div class="patient-info">
                    <h5>${getValue(patient.name, 'Nome não informado')}</h5>
                    <p><strong>Mãe:</strong> ${getValue(patient.motherName, 'Não informado')}</p>
                    <p><strong>Idade:</strong> ${ageText}</p>
                    <p><strong>Entrada:</strong> ${getValue(patient.entryTime, 'Não registrado')}</p>
                    ${patient.exitTime ? `<p><strong>Saída:</strong> ${patient.exitTime} ${patient.exitDate ? '(' + patient.exitDate + ')' : ''}</p>` : ''}
                    <p><strong>Endereço:</strong> ${getValue(patient.address, 'Não informado')} ${patient.complement ? ' - ' + patient.complement : ''}</p>
                    <p><strong>Contatos:</strong> ${getValue(patient.contacts, 'Não informado')}</p>
                    <p><strong>Observações:</strong> ${getValue(patient.notes, 'Nenhuma')}</p>
                    <button class="btn btn-danger btn-sm remove-btn" data-id="${patient.id}">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
                <span class="category-badge ${getCategoryClass(patient.category)}">${getValue(patient.category, 'Sem categoria')}</span>
            </div>
        `;
        return card;
    }

    // Função para remover paciente individual
    function removePatient(patientId) {
        if (confirm('Tem certeza que deseja remover este paciente?')) {
            try {
                let patients = getPatientsFromStorage();
                patients = patients.filter(p => p.id !== patientId);
                localStorage.setItem('patients', JSON.stringify(patients));
                loadPatients();
                showAlert('Paciente removido com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao remover paciente:', error);
                showAlert('Erro ao remover paciente', 'danger');
            }
        }
    }

    // Função para remover pacientes selecionados
    function removeSelectedPatients() {
        const selectedIds = Array.from(document.querySelectorAll('.patient-checkbox:checked'))
                               .map(checkbox => parseInt(checkbox.dataset.id));

        if (selectedIds.length === 0) return;

        if (confirm(`Tem certeza que deseja remover ${selectedIds.length} paciente(s) selecionado(s)?`)) {
            try {
                let patients = getPatientsFromStorage();
                patients = patients.filter(p => !selectedIds.includes(p.id));
                localStorage.setItem('patients', JSON.stringify(patients));
                loadPatients();
                showAlert(`${selectedIds.length} paciente(s) removido(s) com sucesso!`, 'success');
            } catch (error) {
                console.error('Erro ao remover pacientes:', error);
                showAlert('Erro ao remover pacientes', 'danger');
            }
        }
    }

    // Função para exportar para Excel
    function exportToExcel() {
        const patients = getPatientsFromStorage();

        if (patients.length === 0) {
            showAlert('Nenhum paciente cadastrado para exportar!', 'warning');
            return;
        }

        let csv = 'Nome,Nome da Mãe,Idade,Data Nascimento,Endereço,Complemento,Contatos,Categoria,Entrada,Saída,Data Saída,Observações\n';
        
        patients.forEach(patient => {
            csv += `"${patient.name || ''}","${patient.motherName || ''}","${patient.age || ''}","${patient.birthDate || ''}",` +
                  `"${patient.address || ''}","${patient.complement || ''}","${patient.contacts || ''}","${patient.category || ''}",` +
                  `"${patient.entryTime || ''}","${patient.exitTime || ''}","${patient.exitDate || ''}","${patient.notes || ''}"\n`;
        });

        downloadFile('pacientes.csv', 'data:text/csv;charset=utf-8,' + encodeURIComponent("\uFEFF" + csv));
    }

    // Função para exportar para PDF
    function exportToPDF() {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const patients = getPatientsFromStorage();

            if (patients.length === 0) {
                showAlert('Nenhum paciente cadastrado para exportar!', 'warning');
                return;
            }

            // Título
            doc.setFontSize(18);
            doc.text('Relatório de Pacientes', 105, 15, { align: 'center' });

            // Cabeçalhos da tabela
            const headers = [
                "Nome",
                "Mãe",
                "Idade",
                "Endereço",
                "Contatos",
                "Categoria",
                "Entrada",
                "Saída"
            ];

            // Dados da tabela
            const data = patients.map(patient => [
                patient.name || '',
                patient.motherName || '',
                patient.age ? patient.age + ' anos' : 'N/A',
                patient.address + (patient.complement ? ' - ' + patient.complement : ''),
                patient.contacts || '',
                patient.category || '',
                patient.entryTime || '',
                patient.exitTime || ''
            ]);

            // Gera a tabela
            doc.autoTable({
                head: [headers],
                body: data,
                startY: 25,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    valign: 'middle'
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                }
            });

            // Salva o PDF
            doc.save('relatorio_pacientes.pdf');
        };
        document.head.appendChild(script);
    }

    // ===== FUNÇÕES AUXILIARES =====
    
    function getPatientsFromStorage() {
        const data = localStorage.getItem('patients');
        return data ? JSON.parse(data) : [];
    }

    function getCategoryClass(category) {
        const classes = {
            'Consulta Rotineira': 'bg-consulta',
            'Tratamento Especial': 'bg-tratamento',
            'Cirurgia': 'bg-cirurgia',
            'Acompanhamento': 'bg-acompanhamento',
            'Relatório Social': 'bg-info text-dark'
        };
        return classes[category] || 'bg-secondary';
    }

    function updateRemoveSelectedButton() {
        const anyChecked = document.querySelectorAll('.patient-checkbox:checked').length > 0;
        removeSelectedBtn.disabled = !anyChecked;
    }

    function downloadFile(filename, data) {
        const link = document.createElement('a');
        link.setAttribute('href', data);
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
        alertDiv.style.zIndex = '1000';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 150);
        }, 3000);
    }
});