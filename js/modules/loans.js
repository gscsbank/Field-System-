// js/modules/loans.js

document.addEventListener('DOMContentLoaded', () => {

    const formLoan = document.getElementById('form-loan-inspection');
    let currentPhotosBase64 = [null, null, null, null, null];

    const logIdInput = document.getElementById('loan-id');
    const tbodyFollowup = document.getElementById('loans-tbody');
    const emptyState = document.getElementById('loans-empty-state');

    const inputDate = document.getElementById('loan-date');
    if (inputDate) inputDate.valueAsDate = new Date();

    for (let i = 1; i <= 5; i++) {
        const inputPhoto = document.getElementById(`loan-photo-${i}`);
        const photoPreview = document.getElementById(`loan-photo-preview-${i}`);

        if (inputPhoto && photoPreview) {
            inputPhoto.addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function (event) {
                    currentPhotosBase64[i - 1] = event.target.result;
                    photoPreview.src = event.target.result;
                    photoPreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            });
        }
    }

    if (formLoan) {
        formLoan.addEventListener('submit', handleFormSubmit);
    }

    document.addEventListener('moduleSwitched', (e) => {
        if (e.detail.target === 'loans') {
            loadLoanReports();
        }
    });

    loadLoanReports();

    async function handleFormSubmit(e) {
        e.preventDefault();

        const id = logIdInput.value;
        const date = document.getElementById('loan-date').value;
        const applicantName = document.getElementById('loan-applicant').value.trim();
        const nic = document.getElementById('loan-nic').value.trim();
        const dob = document.getElementById('loan-dob').value;
        const address = document.getElementById('loan-address').value.trim();
        const phone = document.getElementById('loan-phone').value.trim();
        const maritalStatus = document.getElementById('loan-marital').value;

        const occupation = document.getElementById('loan-occupation').value.trim();
        const servicePeriod = document.getElementById('loan-service-period').value.trim();
        const workplace = document.getElementById('loan-workplace').value.trim();
        const income = parseFloat(document.getElementById('loan-income').value) || 0;
        const otherIncome = parseFloat(document.getElementById('loan-other-income').value) || 0;

        const loanType = document.getElementById('loan-type').value.trim();
        const amount = parseFloat(document.getElementById('loan-amount').value) || 0;
        const duration = document.getElementById('loan-duration').value.trim();
        const purpose = document.getElementById('loan-purpose').value.trim();

        const existingLoanDetails = document.getElementById('loan-existing-details').value.trim();
        const existingLoanAmt = parseFloat(document.getElementById('loan-existing-amt').value) || 0;
        const existingLoanInst2 = document.getElementById('loan-existing-inst2').value.trim();
        const existingLoanAmt2 = parseFloat(document.getElementById('loan-existing-amt2').value) || 0;
        const liabilities = parseFloat(document.getElementById('loan-liabilities').value) || 0;

        const bizRegNo = document.getElementById('biz-reg-no').value.trim();
        const bizName = document.getElementById('biz-name').value.trim();
        const bizAddress = document.getElementById('biz-address').value.trim();
        const bizGrossIncome = parseFloat(document.getElementById('biz-gross-income').value) || 0;
        const bizNature = document.getElementById('biz-nature').value.trim();

        const discTxLevel = document.getElementById('disc-tx-level').value.trim();
        const discIncomeGen = document.getElementById('disc-income-gen').value.trim();
        const discSuccessPotential = document.getElementById('disc-success-potential').value.trim();
        const discOfficerNote = document.getElementById('disc-officer-note').value.trim();
        const discOfficerName = document.getElementById('disc-officer-name').value.trim();
        const discDesignation = document.getElementById('disc-designation').value.trim();

        const mgrDate = document.getElementById('mgr-date').value;
        const mgrRecommendation = document.getElementById('mgr-recommendation').value.trim();

        const mgrDecApprove = document.getElementById('mgr-dec-approve').checked;
        const mgrDecReject = document.getElementById('mgr-dec-reject').checked;
        const mgrDecReview = document.getElementById('mgr-dec-review').checked;

        const colLand = document.getElementById('col-land').checked;
        const colVehicle = document.getElementById('col-vehicle').checked;
        const colGuarantor = document.getElementById('col-guarantor').checked;
        const colOther = document.getElementById('col-other').value.trim();
        const assets = document.getElementById('loan-assets').value.trim();

        const g1Name = document.getElementById('g1-name').value.trim();
        const g1Nic = document.getElementById('g1-nic').value.trim();
        const g1Address = document.getElementById('g1-address').value.trim();
        const g1Phone = document.getElementById('g1-phone').value.trim();

        const g2Name = document.getElementById('g2-name').value.trim();
        const g2Nic = document.getElementById('g2-nic').value.trim();
        const g2Address = document.getElementById('g2-address').value.trim();
        const g2Phone = document.getElementById('g2-phone').value.trim();

        const commonData = {
            date, applicantName, nic, dob, address, phone, maritalStatus,
            occupation, servicePeriod, workplace, income, otherIncome,
            loanType, amount, duration, purpose, existingLoanDetails, existingLoanAmt, existingLoanInst2, existingLoanAmt2, liabilities,
            bizRegNo, bizName, bizAddress, bizGrossIncome, bizNature,
            discTxLevel, discIncomeGen, discSuccessPotential, discOfficerNote, discOfficerName, discDesignation,
            mgrDate, mgrRecommendation, mgrDecApprove, mgrDecReject, mgrDecReview,
            colLand, colVehicle, colGuarantor, colOther, assets,
            g1Name, g1Nic, g1Address, g1Phone,
            g2Name, g2Nic, g2Address, g2Phone,
        };

        try {
            let reportData;

            if (id) {
                const existingLog = await db.loanReports.get(parseInt(id));
                let mergedPhotos = [...currentPhotosBase64];

                // Fallback for legacy single-photo string format
                if (existingLog.photos && typeof existingLog.photos === 'string' && !mergedPhotos[0]) {
                    mergedPhotos[0] = existingLog.photos;
                } else if (existingLog.photos && Array.isArray(existingLog.photos)) {
                    for (let i = 0; i < 5; i++) {
                        if (!mergedPhotos[i]) mergedPhotos[i] = existingLog.photos[i];
                    }
                }

                reportData = {
                    ...commonData,
                    photos: mergedPhotos,
                    postVisits: existingLog.postVisits || []
                };
                await db.loanReports.update(parseInt(id), reportData);
            } else {
                reportData = {
                    ...commonData,
                    photos: [...currentPhotosBase64],
                    postVisits: []
                };
                await db.loanReports.add(reportData);
            }

            generatePDF(reportData);

            formLoan.reset();
            logIdInput.value = '';
            if (inputDate) inputDate.valueAsDate = new Date();
            for (let i = 1; i <= 5; i++) {
                const preview = document.getElementById(`loan-photo-preview-${i}`);
                if (preview) {
                    preview.src = '';
                    preview.classList.add('hidden');
                }
            }
            currentPhotosBase64 = [null, null, null, null, null];

            loadLoanReports();

            window.showAlert('Success', id ? 'Inspection updated and PDF regenerated!' : 'Inspection saved and PDF generated!', 'success');
        } catch (error) {
            console.error("Failed to save loan inspection:", error);
            window.showAlert('Error', 'Error saving record.', 'error');
        }
    }

    function generatePDF(data) {

        let printWindow = window.open('', '_blank');

        const template = `
            <!DOCTYPE html>
            <html lang="si">
            <head>
                <title>Loan Pre-Inspection - ${data.applicantName}</title>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    body { 
                        font-family: '4u-Malith', 'Noto Sans Sinhala', 'Arial', sans-serif; 
                        color: #000; 
                        line-height: 1.5; 
                        margin: 0; 
                        padding: 0; 
                        font-size: 13px;
                        background-color: #fff;
                    }
                    
                    /* Non-typing elements should use standard font */
                    h1, h2, h3, .field-label, th, .header-text {
                        font-family: 'Noto Sans Sinhala', 'Arial', 'Helvetica', sans-serif !important;
                    }
                    
                    .print-container { 
                        width: 100%;
                        background-color: white;
                        box-sizing: border-box;
                    }

                    /* Legal Header Styling */
                    .document-header {
                        display: flex;
                        align-items: flex-end;
                        justify-content: space-between;
                        border-bottom: 2px solid #000;
                        padding-bottom: 12px;
                        margin-bottom: 25px;
                    }
                    
                    .header-left {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    
                    .logo-img {
                        height: 50px;
                        filter: grayscale(100%);
                    }

                    .header-text h1 {
                        font-size: 18px;
                        font-weight: 700;
                        margin: 0;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .header-text p {
                        font-size: 11px;
                        color: #333;
                        margin: 2px 0 0 0;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }

                    .header-right {
                        text-align: right;
                        font-size: 10px;
                        font-weight: 600;
                    }

                    /* Formal Sections */
                    h2 { 
                        font-size: 13px; 
                        font-weight: 700; 
                        margin: 20px 0 10px 0; 
                        border-bottom: 1.5px solid #000;
                        padding-bottom: 3px;
                        text-transform: uppercase;
                    }

                    table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                    td { padding: 5px 0; vertical-align: top; }
                    
                    .field-label { width: 40%; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #444; }
                    .field-value { font-weight: 700; border-bottom: 1px solid #aaa; padding-left: 10px; font-size: 14px; }

                    .border-table { margin-top: 10px; border: 1.5px solid #000; }
                    .border-table th, .border-table td { border: 1px solid #000; padding: 8px; }
                    .border-table th { background-color: #f0f0f0; text-align: left; font-size: 11px; text-transform: uppercase; }

                    .box { 
                        padding: 10px; 
                        border: 1px solid #666; 
                        min-height: 40px; 
                        font-weight: 700; 
                        background: #fff; 
                        margin-top: 5px; 
                        font-size: 14px;
                    }

                    /* Signature Blocks */
                    .signature-grid {
                        display: grid;
                        grid-template-cols: 1fr 1fr;
                        gap: 40px;
                        margin-top: 40px;
                    }
                    
                    .sig-item {
                        text-align: center;
                    }
                    
                    .sig-line {
                        border-top: 1.5px solid #000;
                        width: 100%;
                        margin-bottom: 5px;
                        padding-top: 5px;
                        font-weight: 700;
                        font-size: 11px;
                        text-transform: uppercase;
                    }
                    
                    .official-seal {
                        border: 1.5px dashed #ccc;
                        width: 80px;
                        height: 80px;
                        margin: 10px auto;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #ccc;
                        font-size: 9px;
                        text-transform: uppercase;
                    }

                    @media print {
                        body { background: #fff; }
                        .no-break { page-break-inside: avoid; }
                        .page-break { page-break-before: always; }
                    }
                </style>
            </head>
            <body>
            <div class="print-container">
                <div class="document-header">
                    <div class="header-left">
                        <img src="img/logo.png" class="logo-img" alt="Logo" onerror="this.style.display='none'">
                        <div class="header-text">
                            <h1>ණය පූර්ව පරීක්ෂණ වාර්තාව</h1>
                            <p>ගලපිටියගම සණස සමුපකාර සමිතිය</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <div>REF: INS-${data.nic ? data.nic.substring(0, 4) : 'TEMP'}-${Math.floor(Math.random() * 900)}</div>
                        <div>GEN: ${new Date().toLocaleDateString('en-CA')}</div>
                    </div>
                </div>

                <div class="no-break">
                    <h2>1. අයදුම්කරු හඳුනා ගැනීම</h2>
                    <table>
                        <tr><td class="field-label">සම්පූර්ණ නම</td><td class="field-value">${data.applicantName}</td></tr>
                        <tr><td class="field-label">ජාතික හැඳුනුම්පත් අංකය (NIC)</td><td class="field-value">${data.nic}</td></tr>
                        <tr><td class="field-label">උපන් දිනය / ලිපිනය</td><td class="field-value">${data.dob} / ${data.address}</td></tr>
                        <tr><td class="field-label">දුරකථන අංකය</td><td class="field-value">${data.phone}</td></tr>
                    </table>
                </div>

                <div class="no-break">
                    <h2>2. රැකියාව සහ මූල්‍ය තත්ත්වය</h2>
                    <table>
                        <tr><td class="field-label">රැකියාව / සේවා ස්ථානය</td><td class="field-value">${data.occupation} - ${data.workplace}</td></tr>
                        <tr><td class="field-label">මාසික / වෙනත් ආදායම</td><td class="field-value">රු. ${data.income.toLocaleString()} / රු. ${data.otherIncome.toLocaleString()}</td></tr>
                        <tr><td class="field-label">සේවා කාලය</td><td class="field-value">${data.servicePeriod}</td></tr>
                    </table>
                </div>

                <div class="no-break">
                    <h2>3. ණය අයදුම්පතේ විස්තර</h2>
                    <table>
                        <tr><td class="field-label">ණය වර්ගය / අරමුණ</td><td class="field-value">${data.loanType} - ${data.purpose}</td></tr>
                        <tr><td class="field-label">අයදුම් කළ මුදල / කාලය</td><td class="field-value">රු. ${data.amount.toLocaleString()} (${data.duration})</td></tr>
                        <tr><td class="field-label">අයදුම් කළ දිනය</td><td class="field-value">${data.date}</td></tr>
                    </table>
                </div>

                <div class="no-break">
                    <h2>4. පවතින බැරකම්</h2>
                    <table class="border-table">
                        <thead>
                            <tr>
                                <th>ආයතනය / විස්තරය</th>
                                <th style="text-align: right;">මුදල (රු.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${data.existingLoanDetails || 'N/A'}</td>
                                <td style="text-align: right;">${data.existingLoanAmt ? data.existingLoanAmt.toLocaleString() : '-'}</td>
                            </tr>
                            ${data.existingLoanInst2 ? `
                            <tr>
                                <td>${data.existingLoanInst2}</td>
                                <td style="text-align: right;">${data.existingLoanAmt2.toLocaleString()}</td>
                            </tr>
                            ` : ''}
                            <tr style="background-color: #f9f9f9;">
                                <td style="text-align: right; font-weight: 700;">මුළු මාසික බැරකම්</td>
                                <td style="text-align: right; font-weight: 700;">රු. ${data.liabilities.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="no-break">
                    <h2>5. ඇපකර සහ දේපල</h2>
                    <div style="margin: 10px 0; border: 1px solid #000; padding: 10px;">
                        <p style="margin: 0; font-size: 11px;">
                            වර්ගය: 
                            <b>${data.colLand ? '[X] ඉඩම් ' : '[ ] ඉඩම් '}</b> &nbsp;&nbsp;
                            <b>${data.colVehicle ? '[X] වාහන ' : '[ ] වාහන '}</b> &nbsp;&nbsp;
                            <b>${data.colGuarantor ? '[X] ඇපකරුවන් ' : '[ ] ඇපකරුවන් '}</b> &nbsp;&nbsp;
                            <b>${data.colOther ? `[X] වෙනත්: ${data.colOther}` : ''}</b>
                        </p>
                        <div class="box">${data.assets}</div>
                    </div>
                </div>

                <div class="page-break"></div>

                <div class="no-break">
                    <h2>6. ඇපකරුවන්ගේ විස්තර</h2>
                    <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; border: 1.5px solid #000; padding: 15px;">
                        <div>
                            <h3 style="font-size: 11px; margin-bottom: 10px;">01 වන ඇපකරු</h3>
                            <div style="font-size: 12px; font-weight: 700;">${data.g1Name || '-'}<br>${data.g1Nic}<br>${data.g1Address}<br>${data.g1Phone}</div>
                        </div>
                        <div style="border-left: 1px solid #000; padding-left: 20px;">
                            <h3 style="font-size: 11px; margin-bottom: 10px;">02 වන ඇපකරු</h3>
                            <div style="font-size: 12px; font-weight: 700;">${data.g2Name || '-'}<br>${data.g2Nic}<br>${data.g2Address}<br>${data.g2Phone}</div>
                        </div>
                    </div>
                </div>

                <div class="no-break">
                    <h2>7. නිලධාරී ඇගයීම සහ සාකච්ඡාව</h2>
                    <table style="margin-bottom: 10px;">
                        <tr><td class="field-label">ගනුදෙනුකරුගේ ගනුදෙනු මට්ටම</td><td class="field-value">${data.discTxLevel}</td></tr>
                        <tr><td class="field-label">ආදායම තහවුරු කිරීමේ තත්ත්වය</td><td class="field-value">${data.discIncomeGen}</td></tr>
                        <tr><td class="field-label">ව්‍යාපාරයේ/ව්‍යාපෘතියේ සාර්ථකත්වය</td><td class="field-value">${data.discSuccessPotential}</td></tr>
                    </table>
                    <div class="box" style="min-height: 60px;">සටහන්: ${data.discOfficerNote}</div>
                    
                    <div class="signature-grid">
                        <div class="sig-item">
                            <div class="sig-line">පරීක්ෂක නිලධාරී අත්සන</div>
                            <div style="font-size: 11px; font-weight: 700;">${data.discOfficerName} (${data.discDesignation})</div>
                        </div>
                        <div class="sig-item">
                            <div class="official-seal">මුද්‍රාව</div>
                        </div>
                    </div>
                </div>

                <div class="no-break">
                    <h2>8. අවසාන කළමනාකරණ සමාලෝචනය</h2>
                    <div class="box" style="min-height: 80px;">නිර්දේශය: ${data.mgrRecommendation}</div>
                    <div style="margin-top: 15px; border: 1.5px solid #000; padding: 10px; text-align: center;">
                        <b>${data.mgrDecApprove ? '[X]' : '[ ]'}</b> අනුමතයි &nbsp;&nbsp;|&nbsp;&nbsp;
                        <b>${data.mgrDecReject ? '[X]' : '[ ]'}</b> ප්‍රතික්ෂේපිතයි &nbsp;&nbsp;|&nbsp;&nbsp;
                        <b>${data.mgrDecReview ? '[X]' : '[ ]'}</b> වැඩිදුර සමාලෝචනය අවශ්‍යයි
                    </div>
                    
                    <div class="signature-grid" style="margin-top: 50px;">
                        <div class="sig-item"><div class="sig-line">කළමනාකරුගේ අත්සන</div><div style="font-size: 11px;">දිනය: ${data.mgrDate}</div></div>
                        <div class="sig-item"><div class="official-seal">කාර්යාල මුද්‍රාව</div></div>
                    </div>
                </div>

                ${(() => {
                let photoArray = [];
                if (Array.isArray(data.photos)) photoArray = data.photos.filter(p => p !== null && p !== '');
                if (photoArray.length > 0) {
                    let html = '<div class="page-break"><h2>9. ක්ෂේත්‍ර පරීක්ෂණ සාක්ෂි ඡායාරූප</h2>';
                    html += '<div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 20px;">';
                    photoArray.forEach(photo => {
                        html += `<img src="${photo}" style="width: 100%; border: 1px solid #000; filter: grayscale(100%);">`;
                    });
                    html += '</div></div>';
                    return html;
                }
                return '';
            })()}
            </div>
            <script>
                window.onload = function() { window.print(); window.onafterprint = function(){ window.close(); } };
            </script>
            </body>
            </html>
        `;
        printWindow.document.write(template);
        printWindow.document.close();
    }

    async function loadLoanReports() {
        if (!tbodyFollowup) return;

        try {
            const reports = await db.loanReports.orderBy('date').reverse().toArray();

            tbodyFollowup.innerHTML = '';
            if (reports.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }

            emptyState.classList.add('hidden');

            reports.forEach(report => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-50/50 transition-colors cursor-pointer group';
                tr.onclick = (e) => {
                    // Prevent row click if clicking edit/delete buttons
                    if (!e.target.closest('.action-btn')) {
                        openFollowupModal(report.id);
                    }
                };

                const formattedDate = new Date(report.date).toLocaleDateString();
                const net = report.income - report.liabilities;
                const statusColor = net > 0 ? 'text-emerald-600' : 'text-red-600';
                const visitsCount = report.postVisits ? report.postVisits.length : 0;

                tr.innerHTML = `
                    <td class="px-5 py-3 border-b border-slate-100 text-slate-700">${formattedDate}</td>
                    <td class="px-5 py-3 border-b border-slate-100 font-normal text-slate-800">${report.applicantName}</td>
                    <td class="px-5 py-3 border-b border-slate-100 text-right font-normal ${statusColor}">Rs. ${net.toLocaleString()}</td>
                    <td class="px-5 py-3 border-b border-slate-100 text-center text-slate-600"><span class="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-normal">${visitsCount} Visits</span></td>
                    <td class="px-5 py-3 border-b border-slate-100 text-center print-hide">
                        <div class="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="action-btn text-primary hover:bg-blue-50 p-2 rounded transition-colors" onclick="event.stopPropagation(); window.regeneratePDF(${report.id});" title="Re-download PDF">
                                <i class="ph ph-download-simple text-lg"></i>
                            </button>
                            <button class="action-btn text-slate-400 hover:text-primary transition-colors p-2" onclick="event.stopPropagation(); window.editLoanInspection(${report.id})" title="Edit"><i class="ph ph-pencil-simple text-lg"></i></button>
                            <button class="action-btn text-slate-400 hover:text-red-500 transition-colors p-2" onclick="event.stopPropagation(); window.deleteLoanInspection(${report.id})" title="Delete"><i class="ph ph-trash text-lg"></i></button>
                        </div>
                    </td>
                `;
                tbodyFollowup.appendChild(tr);
            });

        } catch (error) {
            console.error("Failed to load loan reports:", error);
        }
    }

    window.editLoanInspection = async (id) => {
        try {
            const log = await db.loanReports.get(id);
            if (log) {
                logIdInput.value = log.id;
                document.getElementById('loan-date').value = log.date;
                document.getElementById('loan-applicant').value = log.applicantName;
                document.getElementById('loan-nic').value = log.nic || '';
                document.getElementById('loan-dob').value = log.dob || '';
                document.getElementById('loan-address').value = log.address || '';
                document.getElementById('loan-phone').value = log.phone || '';
                if (log.maritalStatus) document.getElementById('loan-marital').value = log.maritalStatus;

                document.getElementById('loan-occupation').value = log.occupation || '';
                document.getElementById('loan-service-period').value = log.servicePeriod || '';
                document.getElementById('loan-workplace').value = log.workplace || '';
                document.getElementById('loan-income').value = log.income;
                document.getElementById('loan-other-income').value = log.otherIncome || 0;

                document.getElementById('loan-type').value = log.loanType || '';
                document.getElementById('loan-amount').value = log.amount || '';
                document.getElementById('loan-duration').value = log.duration || '';
                document.getElementById('loan-purpose').value = log.purpose || '';

                document.getElementById('loan-existing-details').value = log.existingLoanDetails || '';
                document.getElementById('loan-existing-amt').value = log.existingLoanAmt || '';
                document.getElementById('loan-existing-inst2').value = log.existingLoanInst2 || '';
                document.getElementById('loan-existing-amt2').value = log.existingLoanAmt2 || '';
                document.getElementById('loan-liabilities').value = log.liabilities;

                document.getElementById('biz-reg-no').value = log.bizRegNo || '';
                document.getElementById('biz-name').value = log.bizName || '';
                document.getElementById('biz-address').value = log.bizAddress || '';
                document.getElementById('biz-gross-income').value = log.bizGrossIncome || '';
                document.getElementById('biz-nature').value = log.bizNature || '';

                document.getElementById('disc-tx-level').value = log.discTxLevel || '';
                document.getElementById('disc-income-gen').value = log.discIncomeGen || '';
                document.getElementById('disc-success-potential').value = log.discSuccessPotential || '';
                document.getElementById('disc-officer-note').value = log.discOfficerNote || '';
                document.getElementById('disc-officer-name').value = log.discOfficerName || '';
                document.getElementById('disc-designation').value = log.discDesignation || '';

                document.getElementById('mgr-date').value = log.mgrDate || '';
                document.getElementById('mgr-recommendation').value = log.mgrRecommendation || '';

                document.getElementById('mgr-dec-approve').checked = !!log.mgrDecApprove;
                document.getElementById('mgr-dec-reject').checked = !!log.mgrDecReject;
                document.getElementById('mgr-dec-review').checked = !!log.mgrDecReview;

                document.getElementById('col-land').checked = !!log.colLand;
                document.getElementById('col-vehicle').checked = !!log.colVehicle;
                document.getElementById('col-guarantor').checked = !!log.colGuarantor;
                document.getElementById('col-other').value = log.colOther || '';
                document.getElementById('loan-assets').value = log.assets;

                document.getElementById('g1-name').value = log.g1Name || '';
                document.getElementById('g1-nic').value = log.g1Nic || '';
                document.getElementById('g1-address').value = log.g1Address || '';
                document.getElementById('g1-phone').value = log.g1Phone || '';

                document.getElementById('g2-name').value = log.g2Name || '';
                document.getElementById('g2-nic').value = log.g2Nic || '';
                document.getElementById('g2-address').value = log.g2Address || '';
                document.getElementById('g2-phone').value = log.g2Phone || '';

                currentPhotosBase64 = [null, null, null, null, null];
                for (let i = 1; i <= 5; i++) {
                    const preview = document.getElementById(`loan-photo-preview-${i}`);
                    if (preview) {
                        preview.src = '';
                        preview.classList.add('hidden');
                    }
                }

                if (log.photos) {
                    if (Array.isArray(log.photos)) {
                        for (let i = 0; i < 5; i++) {
                            const preview = document.getElementById(`loan-photo-preview-${i + 1}`);
                            if (log.photos[i] && preview) {
                                preview.src = log.photos[i];
                                preview.classList.remove('hidden');
                                currentPhotosBase64[i] = log.photos[i];
                            }
                        }
                    } else if (typeof log.photos === 'string') {
                        // Legacy single photo wrapper
                        const preview = document.getElementById(`loan-photo-preview-1`);
                        if (preview) {
                            preview.src = log.photos;
                            preview.classList.remove('hidden');
                            currentPhotosBase64[0] = log.photos;
                        }
                    }
                }
                document.getElementById('loan-applicant').focus();
            }
        } catch (e) {
            console.error(e);
        }
    };

    window.deleteLoanInspection = async (id) => {
        const confirmed = await window.showConfirm(
            'Delete Report',
            'Are you sure you want to delete this loan inspection?',
            'Yes, delete'
        );
        if (confirmed) {
            try {
                await db.loanReports.delete(id);
                window.showToast('Inspection deleted');
                loadLoanReports();

                if (window.SyncManager && window.SyncManager.deleteFromCloud) {
                    await window.SyncManager.deleteFromCloud('loanReports', id);
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    // Expose regenerate PDF to global scope for the inline onclick handler
    window.regeneratePDF = async function (id) {
        try {
            const report = await db.loanReports.get(id);
            if (report) {
                generatePDF(report);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Follow Up Modal Logic
    const followupModal = document.getElementById('modal-post-loan');
    const followupCloseBtns = document.querySelectorAll('.post-loan-close');
    const followupForm = document.getElementById('form-post-loan');
    const followupContainer = document.getElementById('post-visits-list');

    let activeReportId = null;

    if (followupCloseBtns) {
        followupCloseBtns.forEach(btn => btn.addEventListener('click', closeFollowupModal));
    }

    if (followupForm) {
        followupForm.addEventListener('submit', handleFollowupSubmit);
    }

    async function openFollowupModal(id) {
        activeReportId = id;
        try {
            const report = await db.loanReports.get(id);
            document.getElementById('post-loan-applicant-title').innerText = `Applicant: ${report.applicantName}`;

            // Render past visits
            renderPostVisits(report.postVisits || []);

            followupModal.classList.remove('hidden');
            followupModal.classList.add('flex');
            document.getElementById('followup-date').valueAsDate = new Date();
        } catch (e) {
            console.error(e);
        }
    }

    function closeFollowupModal() {
        followupModal.classList.add('hidden');
        followupModal.classList.remove('flex');
        followupForm.reset();
        activeReportId = null;
    }

    function renderPostVisits(visits) {
        followupContainer.innerHTML = '';
        if (visits.length === 0) {
            followupContainer.innerHTML = '<p class="text-xs text-slate-400 italic">No post-visits recorded yet.</p>';
            return;
        }

        visits.forEach(v => {
            const div = document.createElement('div');
            div.className = 'bg-slate-50 p-3 rounded border border-slate-100 mb-2';
            div.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-normal text-slate-700"><i class="ph ph-calendar-blank mr-1"></i>${v.date}</span>
                    <span class="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">${v.status}</span>
                </div>
                <p class="text-xs text-slate-600">${v.note}</p>
            `;
            followupContainer.appendChild(div);
        });
    }

    async function handleFollowupSubmit(e) {
        e.preventDefault();
        if (!activeReportId) return;

        const date = document.getElementById('followup-date').value;
        const status = document.getElementById('followup-status').value;
        const note = document.getElementById('followup-note').value.trim();

        try {
            const report = await db.loanReports.get(activeReportId);
            if (!report.postVisits) report.postVisits = [];

            report.postVisits.push({ date, status, note });

            await db.loanReports.put(report);

            // Refresh modal view
            renderPostVisits(report.postVisits);
            followupForm.reset();
            document.getElementById('followup-date').valueAsDate = new Date();

            // Refresh background table to update count
            loadLoanReports();

        } catch (error) {
            console.error("Failed to save follow-up", error);
        }
    }
});
