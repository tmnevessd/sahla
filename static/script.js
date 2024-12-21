document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewImage = document.getElementById('previewImage');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    const developerName = document.getElementById('developerName');
    const loadingAnimation = document.getElementById('loadingAnimation');

    // Add mobile detection
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // Adjust upload box size for mobile
        dropZone.style.width = '90%';
        dropZone.style.maxWidth = '300px';

        // Adjust preview image size
        previewImage.style.maxWidth = '100px';
        previewImage.style.maxHeight = '100px';
    }

    // Handle click on upload box
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor =    '#1a73e8';  
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ccc';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        handleFile(file);
    });

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewImage.style.width = '150px';
                previewImage.style.height = '150px';
                previewImage.style.objectFit = 'contain';
                analyzeBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    }

    function formatResult(analysisText) {
        let formattedHtml = '<div class="result-container">';
        formattedHtml += `
            <div class="section-content">
                مرحبا! 👋 
                غادي نقول ليك كولشي على ${productName} ديالك
            </div>
        `;
        
        // تقسيم المعلومات للأقسام الرئيسية
        const sections = [
            {
                icon: '🏷️',
                title: 'المنتوج',
                class: 'product-box'
            },
            {
                icon: '💰',
                title: 'الثمن',
                class: 'price-box'
            },
            {
                icon: '📝',
                title: 'الاستعمال',
                class: 'usage-box'
            },
            {
                icon: '📦',
                title: 'التخزين',
                class: 'storage-box'
            },
            {
                icon: '⚠️',
                title: 'نصائح',
                class: 'tips-box'
            }
        ];

        // Split text into sections
        const textSections = analysisText.split(/[1-5]⃣/).filter(Boolean);

        // Create boxes
        sections.forEach((section, index) => {
            if (textSections[index]) {
                formattedHtml += `
                    <div class="info-box ${section.class}">
                        <div class="box-header">
                            <span class="box-icon">${section.icon}</span>
                            <span class="box-title">${section.title}</span>
                        </div>
                        <div class="box-content">
                            ${formatPoints(textSections[index])}
                        </div>
                    </div>
                `;
            }
        });

        formattedHtml += '</div>';
        return formattedHtml;
    }

    function formatPoints(text) {
        // نظف النص من العلامات الزائدة
        let cleanText = text
            .replace(/\*\*/g, '')         // حذف **
            .replace(/\*/g, '')           // حذف *
            .replace(/•/g, '•')           // توحيد شكل النقط
            .trim();

        // قسم النص لنقط
        const points = cleanText.split('•').filter(point => {
            const trimmedPoint = point.trim();
            return trimmedPoint && !trimmedPoint.startsWith('**') && trimmedPoint.length > 1;
        });

        // تنسيق كل نقطة
        return points.map(point => {
            // تقسيم السؤال والجواب
            let [question, answer] = point.split('?');
            
            if (answer) {
                // إذا كان هناك سؤال وجواب
                return `
                    <div class="point">
                        <div class="question">
                            <span class="bullet">•</span>
                            ${question.trim()}؟
                        </div>
                        <div class="answer">
                            ${answer.trim()}
                        </div>
                    </div>
                `;
            } else {
                // إذا كانت نقطة عادية
                return `
                    <div class="point">
                        <span class="bullet">•</span>
                        <span class="point-text">${point.trim()}</span>
                    </div>
                `;
            }
        }).join('');
    }

    // Add this function at the top of your script, after the DOM content loaded event listener
    function scrollToResults() {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Enhance loading animation
    function showLoadingAnimation() {
        const analyzingImage = document.getElementById('analyzing-image');
        analyzingImage.src = previewImage.src;
        loadingAnimation.style.display = 'flex';
        loadingAnimation.style.opacity = 0;
        setTimeout(() => {
            loadingAnimation.style.opacity = 1;
        }, 100);
    }

    function hideLoadingAnimation() {
        loadingAnimation.style.opacity = 0;
        setTimeout(() => {
            loadingAnimation.style.display = 'none';
        }, 300);
    }

    // Handle analyze button click
    analyzeBtn.addEventListener('click', async () => {
        analyzeBtn.disabled = true;
        
        // Show loading animation
        showLoadingAnimation();

        // Show developer name with animation
        developerName.style.display = 'block';
        setTimeout(() => {
            developerName.classList.add('show');
        }, 100);

        try {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);

            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Hide loading animation
            hideLoadingAnimation();
            
            // Show result section and scroll to it
            resultSection.style.display = 'block';
            resultContent.innerHTML = data.result;
            
            // Add a small delay to ensure the content is rendered before scrolling
            setTimeout(() => {
                scrollToResults();
            }, 100);

        } catch (error) {
            console.error('فشل التحليل:', error);
            resultContent.innerHTML = '<p class="error">عذراً، حدث خطأ. حاول مرة أخرى.</p>';
            resultSection.style.display = 'none'; // Hide results section on error
            
            // Hide loading animation on error too
            hideLoadingAnimation();
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'حلل المنتج';
        }
    });
});