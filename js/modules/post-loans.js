// js/modules/post-loans.js
document.addEventListener('DOMContentLoaded', () => {
    const formPostLoan = document.getElementById('form-post-loan-inspection');
    const tbody = document.getElementById('post-loans-tbody');
    const emptyState = document.getElementById('post-loans-empty-state');
    const idInput = document.getElementById('post-loan-id');

    // Trigger load when view is activated
    document.addEventListener('moduleSwitched', (e) => {
        if (e.detail.target === 'post-loans') {
            loadPostLoans();
        }
    });

    if (formPostLoan) {
        formPostLoan.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleFormSubmit();
        });
    }

    async function loadPostLoans() {
        if (!tbody) return;
        try {
            const records = await db.postLoanReports.orderBy('date').reverse().toArray();
            tbody.innerHTML = '';

            if (records.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                emptyState.classList.add('hidden');
                records.forEach(log => {
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-slate-50 transition-colors cursor-pointer';
                    // Make row clickable to load data
                    row.addEventListener('click', (e) => {
                        if (!e.target.closest('button')) {
                            editPostLoan(log);
                        }
                    });

                    row.innerHTML = `
                        <td class="px-5 py-4 whitespace-nowrap text-slate-700 font-normal">${log.date}</td>
                        <td class="px-5 py-4 whitespace-nowrap text-slate-900 font-normal">${log.applicantName}</td>
                        <td class="px-5 py-4 whitespace-nowrap text-center print-hide">
                            <button class="btn-print text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors mr-2" data-id="${log.id}" title="Print report"><i class="ph ph-printer text-lg"></i></button>
                            <button class="btn-delete text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" data-id="${log.id}" title="Delete"><i class="ph ph-trash text-lg"></i></button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                // Attach Action Listeners
                document.querySelectorAll('.btn-print').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const id = Number(e.currentTarget.getAttribute('data-id'));
                        await printPostLoan(id);
                    });
                });

                document.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const id = Number(e.currentTarget.getAttribute('data-id'));
                        if (await window.showConfirm("Delete Report?", "This action cannot be undone.")) {
                            await db.postLoanReports.delete(id);
                            window.showToast("Report deleted successfully");
                            loadPostLoans();
                            formPostLoan.reset();
                            idInput.value = '';

                            if (window.SyncManager && window.SyncManager.deleteFromCloud) {
                                await window.SyncManager.deleteFromCloud('postLoanReports', id);
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error("Failed to load post loan reports:", error);
        }
    }

    async function handleFormSubmit() {
        const id = idInput.value ? Number(idInput.value) : null;

        const data = {
            date: document.getElementById('plDate').value,
            accountNo: document.getElementById('plAccNo').value,
            applicantName: document.getElementById('plName').value,
            nic: document.getElementById('plNic').value,
            address: document.getElementById('plAddress').value,
            phone: document.getElementById('plPhone').value,
            loanAgreementNo: document.getElementById('plLoanAgreementNo').value,

            givenAmt: document.getElementById('plGivenAmt').value,
            installment: document.getElementById('plInstallment').value,
            loanPeriod: document.getElementById('plLoanPeriod').value,
            releaseDate: document.getElementById('plReleaseDate').value,

            incomeBefore: document.getElementById('plIncomeBefore').value,
            incomeNow: document.getElementById('plIncomeNow').value,
            expenseBefore: document.getElementById('plExpenseBefore').value,
            expenseNow: document.getElementById('plExpenseNow').value,
            profitBefore: document.getElementById('plProfitBefore').value,
            profitNow: document.getElementById('plProfitNow').value,

            bizGrowthTx: document.getElementById('plBizGrowthTx').value,
            bizGrowthCus: document.getElementById('plBizGrowthCus').value,
            bizGrowthEquip: document.getElementById('plBizGrowthEquip').value,
            bizGrowthChanges: document.getElementById('plBizGrowthChanges').value,

            useCorrect: document.getElementById('plUseCorrect').value,
            useDocs: document.getElementById('plUseDocs').value,
            useDesc: document.getElementById('plUseDesc').value,

            repayRegular: document.getElementById('plRepayRegular').value,
            repayIssues: document.getElementById('plRepayIssues').value,
            repayBalance: document.getElementById('plRepayBalance').value,
            repayDelayReason: document.getElementById('plRepayDelayReason').value,

            monDate: document.getElementById('plMonDate').value,
            monOfficer: document.getElementById('plMonOfficer').value,
            monSuccess: document.getElementById('plMonSuccess').value,
            monRisk: document.getElementById('plMonRisk').value,
            monNote: document.getElementById('plMonNote').value,

            recAdvise: document.getElementById('plRecAdvise').checked,
            recFinAdvise: document.getElementById('plRecFinAdvise').checked,
            recTraining: document.getElementById('plRecTraining').checked,
            recNewLoan: document.getElementById('plRecNewLoan').checked,
            recWarning: document.getElementById('plRecWarning').checked,
            recOther: document.getElementById('plRecOther').value,

            offName: document.getElementById('plOffName').value,
            offDesignation: document.getElementById('plOffDesignation').value,
            offDate: document.getElementById('plOffDate').value
        };

        try {
            if (id) {
                await db.postLoanReports.update(id, data);
            } else {
                await db.postLoanReports.add(data);
            }

            formPostLoan.reset();
            idInput.value = '';

            // Reload table
            await loadPostLoans();

            // Find id of the latest one if it was a new record
            let printId = id;
            if (!printId) {
                const latest = await db.postLoanReports.orderBy('id').last();
                printId = latest.id;
            }
            // Generate PDF Print View
            await printPostLoan(printId);

        } catch (error) {
            console.error("Failed to save report:", error);
            window.showToast("Error saving report", "error");
        }
    }

    function editPostLoan(log) {
        idInput.value = log.id;
        document.getElementById('plDate').value = log.date || '';
        document.getElementById('plAccNo').value = log.accountNo || '';
        document.getElementById('plName').value = log.applicantName || '';
        document.getElementById('plNic').value = log.nic || '';
        document.getElementById('plAddress').value = log.address || '';
        document.getElementById('plPhone').value = log.phone || '';
        document.getElementById('plLoanAgreementNo').value = log.loanAgreementNo || '';

        document.getElementById('plGivenAmt').value = log.givenAmt || '';
        document.getElementById('plInstallment').value = log.installment || '';
        document.getElementById('plLoanPeriod').value = log.loanPeriod || '';
        document.getElementById('plReleaseDate').value = log.releaseDate || '';

        document.getElementById('plIncomeBefore').value = log.incomeBefore || '';
        document.getElementById('plIncomeNow').value = log.incomeNow || '';
        document.getElementById('plExpenseBefore').value = log.expenseBefore || '';
        document.getElementById('plExpenseNow').value = log.expenseNow || '';
        document.getElementById('plProfitBefore').value = log.profitBefore || '';
        document.getElementById('plProfitNow').value = log.profitNow || '';

        document.getElementById('plBizGrowthTx').value = log.bizGrowthTx || '';
        document.getElementById('plBizGrowthCus').value = log.bizGrowthCus || '';
        document.getElementById('plBizGrowthEquip').value = log.bizGrowthEquip || '';
        document.getElementById('plBizGrowthChanges').value = log.bizGrowthChanges || '';

        document.getElementById('plUseCorrect').value = log.useCorrect || '';
        document.getElementById('plUseDocs').value = log.useDocs || '';
        document.getElementById('plUseDesc').value = log.useDesc || '';

        document.getElementById('plRepayRegular').value = log.repayRegular || '';
        document.getElementById('plRepayIssues').value = log.repayIssues || '';
        document.getElementById('plRepayBalance').value = log.repayBalance || '';
        document.getElementById('plRepayDelayReason').value = log.repayDelayReason || '';

        document.getElementById('plMonDate').value = log.monDate || '';
        document.getElementById('plMonOfficer').value = log.monOfficer || '';
        document.getElementById('plMonSuccess').value = log.monSuccess || '';
        document.getElementById('plMonRisk').value = log.monRisk || '';
        document.getElementById('plMonNote').value = log.monNote || '';

        document.getElementById('plRecAdvise').checked = log.recAdvise || false;
        document.getElementById('plRecFinAdvise').checked = log.recFinAdvise || false;
        document.getElementById('plRecTraining').checked = log.recTraining || false;
        document.getElementById('plRecNewLoan').checked = log.recNewLoan || false;
        document.getElementById('plRecWarning').checked = log.recWarning || false;
        document.getElementById('plRecOther').value = log.recOther || '';

        document.getElementById('plOffName').value = log.offName || '';
        document.getElementById('plOffDesignation').value = log.offDesignation || '';
        document.getElementById('plOffDate').value = log.offDate || '';

        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.showToast("Record loaded for editing", "info");
    }

    async function printPostLoan(id) {
        try {
            const data = await db.postLoanReports.get(id);
            if (data) {
                generatePDF(data);
            }
        } catch (error) {
            console.error(error);
        }
    }

    function generatePDF(data) {
        const checkboxState = (isChecked) => isChecked ? 'X' : '';
        const inlineChoice = (selOption, target) => selOption === target ? '<span style="border:1px solid #000; padding: 0 4px; background: #e2e8f0; font-weight:bold;">' + target + '</span>' : target;

        const html = `
        <!DOCTYPE html>
        <html lang="si">
        <head>
            <title>Post-Loan Inspection - ${data.applicantName}</title>
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
                
                h1, h2, h3, .field-label, th, .header-text {
                    font-family: 'Noto Sans Sinhala', 'Arial', 'Helvetica', sans-serif !important;
                }
                
                .print-container { 
                    width: 100%;
                    background-color: white;
                    box-sizing: border-box;
                }

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
                
                .logo-img { height: 50px; filter: grayscale(100%); }

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

                .signature-grid {
                    display: grid;
                    grid-template-cols: 1fr 1fr;
                    gap: 40px;
                    margin-top: 40px;
                }
                
                .sig-item { text-align: center; }
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
                    width: 80px; height: 80px;
                    margin: 10px auto;
                    border-radius: 50%;
                    display: flex;
                    align-items: center; justify-content: center;
                    color: #ccc; font-size: 9px; text-transform: uppercase;
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
                        <h1>ණය පසු පරීක්ෂණ වාර්තාව</h1>
                        <p>ගලපිටියගම සණස සමුපකාර සමිතිය</p>
                    </div>
                </div>
                <div class="header-right">
                    <div>ගිණුම් අංකය: ${data.accountNo || 'N/A'}</div>
                    <div>ජනනය කළ දිනය: ${new Date().toLocaleDateString('en-CA')}</div>
                </div>
            </div>

            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 30px;">
                <!-- Left Side: Identification -->
                <div>
                    <h2>1. සේවාලාභියාගේ තොරතුරු</h2>
                    <table>
                        <tr><td class="field-label">නම</td><td class="field-value">${data.applicantName}</td></tr>
                        <tr><td class="field-label">ජා.හැ.අංකය</td><td class="field-value">${data.nic}</td></tr>
                        <tr><td class="field-label">ලිපිනය</td><td class="field-value">${data.address}</td></tr>
                        <tr><td class="field-label">ගිවිසුම් අංකය</td><td class="field-value">${data.loanAgreementNo}</td></tr>
                    </table>

                    <h2>2. මූල්‍ය සාරාංශය</h2>
                    <table>
                        <tr><td class="field-label">ණය මුදල</td><td class="field-value">රු. ${Number(data.givenAmt || 0).toLocaleString()}</td></tr>
                        <tr><td class="field-label">වාරිකය</td><td class="field-value">රු. ${Number(data.installment || 0).toLocaleString()}</td></tr>
                        <tr><td class="field-label">හිඟ මුදල</td><td class="field-value" style="color:#b91c1c;">රු. ${Number(data.repayBalance || 0).toLocaleString()}</td></tr>
                    </table>
                </div>

                <!-- Right Side: Business Impact -->
                <div>
                    <h2>3. ව්‍යාපාරික කාර්ය සාධනය</h2>
                    <table class="border-table">
                        <thead>
                            <tr><th>මිනුම් දණ්ඩ</th><th>පෙර (රු.)</th><th>වර්තමාන (රු.)</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>මාසික ආදායම</td>
                                <td>${Number(data.incomeBefore || 0).toLocaleString()}</td>
                                <td style="font-weight:700;">${Number(data.incomeNow || 0).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td>මාසික වියදම</td>
                                <td>${Number(data.expenseBefore || 0).toLocaleString()}</td>
                                <td style="font-weight:700;">${Number(data.expenseNow || 0).toLocaleString()}</td>
                            </tr>
                            <tr style="background:#f0f0f0;">
                                <td>ශුද්ධ ලාභය</td>
                                <td>${Number(data.profitBefore || 0).toLocaleString()}</td>
                                <td style="font-weight:700;">${Number(data.profitNow || 0).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="no-break">
                <h2>4. මෙහෙයුම් ඇගයීම</h2>
                <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px;">
                    <div>
                        <h3 style="font-size:11px; margin-bottom:5px;">භාවිතය තහවුරු කිරීම</h3>
                        <div style="font-size:12px;"> මුදල් නිවැරදිව භාවිතා කර තිබේද: <b>${data.useCorrect}</b></div>
                        <div style="font-size:12px;"> ලේඛන පරීක්ෂා කරන ලදී: <b>${data.useDocs}</b></div>
                        <div class="box" style="min-height:40px;">භාවිතය පිළිබඳ සටහන්: ${data.useDesc}</div>
                    </div>
                    <div>
                        <h3 style="font-size:11px; margin-bottom:5px;">ණය ආපසු ගෙවීමේ හැසිරීම</h3>
                        <div style="font-size:12px;"> නිවැරදිව වාරික ගෙවා තිබේද: <b>${data.repayRegular}</b></div>
                        <div style="font-size:12px;"> ගෙවීමේ ගැටළු තිබේද: <b>${data.repayIssues}</b></div>
                        <div class="box" style="min-height:40px;">ප්‍රමාද වීමට හේතු: ${data.repayDelayReason}</div>
                    </div>
                </div>
            </div>

            <div class="no-break">
                <h2>5. පරීක්ෂණ සොයාගැනීම් සහ අවදානම් විශ්ලේෂණය</h2>
                <table style="margin-bottom:10px;">
                    <tr><td class="field-label">පරීක්ෂණ දිනය</td><td class="field-value">${data.monDate}</td></tr>
                    <tr><td class="field-label">සාර්ථක වීමේ හැකියාව</td><td class="field-value">${data.monSuccess}</td></tr>
                    <tr><td class="field-label">අවදානමට නිරාවරණය වීම</td><td class="field-value">${data.monRisk}</td></tr>
                </table>
                <div class="box" style="min-height:60px;">නිලධාරියාගේ උපායමාර්ගික සටහන: ${data.monNote}</div>
            </div>

            <div class="signature-grid">
                <div class="sig-item">
                    <div class="sig-line">පරීක්ෂක නිලධාරී අත්සන</div>
                    <div style="font-size: 11px; font-weight: 700;">${data.monOfficer}</div>
                </div>
                <div class="sig-item">
                    <div class="sig-line">ශාඛා කළමනාකරුගේ අනුමැතිය</div>
                    <div class="official-seal">කාර්යාල මුද්‍රාව</div>
                </div>
            </div>

            ${(() => {
                let photoArray = [];
                if (Array.isArray(data.photos)) photoArray = data.photos.filter(p => p !== null && p !== '');
                if (photoArray.length > 0) {
                    let html = '<div class="page-break"><h2>6. ණය පසු පරීක්ෂණ ඡායාරූප</h2>';
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

        const printWin = window.open('', '_blank');
        if (printWin) {
            printWin.document.write(html);
            printWin.document.close();
        } else {
            alert('Please allow popups for this site to print the form.');
        }
    }
});
