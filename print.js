(function () {
    'use strict';

    var DEFAULT_ORDER = ['edge-ai', 'golf', 'lumi', 'kinderbot', 'rppg'];
    var SHORT_LABELS = {
        'kinderbot': 'KinderBot',
        'lumi': 'Lumi',
        'golf': 'Eagle Eye',
        'edge-ai': 'Edge AI Vision',
        'rppg': 'rPPG'
    };

    var selectedOrder = DEFAULT_ORDER.slice();
    var isCustomPrintActive = false;

    var openBtn = document.getElementById('open-print-modal-btn');
    var modal = document.getElementById('print-modal');
    var closeBtn = document.getElementById('close-print-modal-btn');
    var cancelBtn = document.getElementById('cancel-print-modal-btn');
    var confirmBtn = document.getElementById('confirm-print-btn');
    var selectAllBtn = document.getElementById('print-select-all');
    var clearAllBtn = document.getElementById('print-clear-all');
    var resetOrderBtn = document.getElementById('print-reset-order');
    var optionList = document.getElementById('print-project-list');
    var previewEl = document.getElementById('print-order-preview');
    var summaryPage = document.getElementById('projects-summary');

    if (!openBtn || !modal || !optionList || !summaryPage) {
        return;
    }

    var checkboxes = Array.prototype.slice.call(
        optionList.querySelectorAll('input[type="checkbox"]')
    );

    var summaryTables = {};
    var projectPages = {};

    DEFAULT_ORDER.forEach(function (key) {
        summaryTables[key] = summaryPage.querySelector('.resume-table[data-project="' + key + '"]');
        projectPages[key] = Array.prototype.slice.call(
            document.querySelectorAll('.page[data-project="' + key + '"]')
        );
    });

    function openModal() {
        renderModalState();
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
    }

    function renderModalState() {
        checkboxes.forEach(function (cb) {
            var key = cb.value;
            var orderIndex = selectedOrder.indexOf(key);
            cb.checked = orderIndex !== -1;

            var badge = modal.querySelector('[data-order-badge="' + key + '"]');
            if (badge) {
                if (orderIndex !== -1) {
                    badge.textContent = String(orderIndex + 1);
                    badge.classList.remove('is-empty');
                } else {
                    badge.textContent = '-';
                    badge.classList.add('is-empty');
                }
            }
        });

        if (previewEl) {
            if (selectedOrder.length === 0) {
                previewEl.textContent = '선택 0개 · 총 2페이지 (Profile, Experience만 인쇄 · Summary 제외)';
            } else {
                var totalPages = 3 + selectedOrder.length * 2;
                var labels = selectedOrder.map(function (key, idx) {
                    return (idx + 1) + '. ' + (SHORT_LABELS[key] || key);
                }).join(' → ');
                previewEl.textContent = '선택 ' + selectedOrder.length + '개 · 총 ' + totalPages + '페이지 | ' + labels;
            }
        }
    }

    function applyPrintLayout(order) {
        var validOrder = Array.isArray(order)
            ? order.filter(function (key) { return DEFAULT_ORDER.indexOf(key) !== -1; })
            : [];
        var selectedSet = {};
        validOrder.forEach(function (key) { selectedSet[key] = true; });

        isCustomPrintActive = true;

        var summaryPageNum = summaryPage.querySelector('.page-number');
        if (validOrder.length === 0) {
            summaryPage.classList.add('print-excluded');
        } else {
            summaryPage.classList.remove('print-excluded');
        }

        DEFAULT_ORDER.forEach(function (key) {
            var table = summaryTables[key];
            if (table) {
                table.classList.add('print-excluded');
            }
        });

        validOrder.forEach(function (key, idx) {
            var table = summaryTables[key];
            if (!table) {
                return;
            }
            table.classList.remove('print-excluded');
            if (summaryPageNum) {
                summaryPage.insertBefore(table, summaryPageNum);
            } else {
                summaryPage.appendChild(table);
            }

            var projNumEl = table.querySelector('.proj-num span:last-child');
            if (projNumEl) {
                projNumEl.textContent = '(' + (idx + 1) + ')';
            }

            var linkEl = table.querySelector('.summary-page-link');
            if (linkEl) {
                var startPage = 4 + idx * 2;
                var endPage = 5 + idx * 2;
                linkEl.textContent = startPage + '–' + endPage + '페이지 ↗';
            }
        });

        DEFAULT_ORDER.forEach(function (key) {
            if (!selectedSet[key]) {
                var hiddenTable = summaryTables[key];
                if (hiddenTable) {
                    if (summaryPageNum) {
                        summaryPage.insertBefore(hiddenTable, summaryPageNum);
                    } else {
                        summaryPage.appendChild(hiddenTable);
                    }
                }
            }
        });

        DEFAULT_ORDER.forEach(function (key) {
            projectPages[key].forEach(function (pageEl) {
                pageEl.classList.add('print-excluded');
            });
        });

        var anchor = summaryPage;
        validOrder.forEach(function (key) {
            projectPages[key].forEach(function (pageEl) {
                pageEl.classList.remove('print-excluded');
                anchor.after(pageEl);
                anchor = pageEl;
            });
        });

        DEFAULT_ORDER.forEach(function (key) {
            if (!selectedSet[key]) {
                projectPages[key].forEach(function (pageEl) {
                    anchor.after(pageEl);
                    anchor = pageEl;
                });
            }
        });

        var allPages = Array.prototype.slice.call(document.querySelectorAll('.page'));
        allPages.forEach(function (pageEl) {
            pageEl.classList.remove('is-last-print-page');
        });

        var visiblePages = allPages.filter(function (pageEl) {
            return !pageEl.classList.contains('print-excluded');
        });

        visiblePages.forEach(function (pageEl, idx) {
            var numEl = pageEl.querySelector('.page-number');
            if (numEl) {
                numEl.textContent = '- ' + (idx + 1) + ' -';
            }
        });

        if (visiblePages.length > 0) {
            visiblePages[visiblePages.length - 1].classList.add('is-last-print-page');
        }
    }

    function restoreDefaultLayout() {
        if (!isCustomPrintActive) {
            return;
        }
        applyPrintLayout(DEFAULT_ORDER);
        isCustomPrintActive = false;
    }

    openBtn.addEventListener('click', openModal);

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
        }
    });

    checkboxes.forEach(function (cb) {
        cb.addEventListener('change', function () {
            var key = cb.value;
            var existingIdx = selectedOrder.indexOf(key);
            if (cb.checked) {
                if (existingIdx === -1) {
                    selectedOrder.push(key);
                }
            } else if (existingIdx !== -1) {
                selectedOrder.splice(existingIdx, 1);
            }
            renderModalState();
        });
    });

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function () {
            DEFAULT_ORDER.forEach(function (key) {
                if (selectedOrder.indexOf(key) === -1) {
                    selectedOrder.push(key);
                }
            });
            renderModalState();
        });
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function () {
            selectedOrder = [];
            renderModalState();
        });
    }

    if (resetOrderBtn) {
        resetOrderBtn.addEventListener('click', function () {
            selectedOrder = DEFAULT_ORDER.slice();
            renderModalState();
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
            closeModal();
            applyPrintLayout(selectedOrder);
            window.print();
        });
    }

    window.addEventListener('afterprint', restoreDefaultLayout);

    window.__portfolioPrint = {
        applyPrintLayout: applyPrintLayout,
        restoreDefaultLayout: restoreDefaultLayout,
        getSelectedOrder: function () {
            return selectedOrder.slice();
        }
    };
})();
