// Interactive functionalities for Al-Quran Academy for Girls
// Including Multi-language (Urdu, English, Arabic) switcher

document.addEventListener('DOMContentLoaded', () => {
  // 1. Language Switcher Engine
  const currentLang = localStorage.getItem('alquran_lang') || 'ur';
  applyLanguage(currentLang);

  const langToggleBtn = document.getElementById('langToggleBtn');
  const langDropdown = document.getElementById('langDropdown');
  const langOptions = document.querySelectorAll('.lang-option');

  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Cycle through languages: ur -> en -> ar -> ur
      const activeLang = localStorage.getItem('alquran_lang') || 'ur';
      let nextLang = 'ur';
      if (activeLang === 'ur') nextLang = 'en';
      else if (activeLang === 'en') nextLang = 'ar';
      else nextLang = 'ur';

      applyLanguage(nextLang);
      localStorage.setItem('alquran_lang', nextLang);
    });

    langOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = opt.getAttribute('data-lang');
        if (lang) {
          applyLanguage(lang);
          localStorage.setItem('alquran_lang', lang);
          if (langDropdown) langDropdown.classList.remove('show');
        }
      });
    });
  }

  function applyLanguage(lang) {
    if (typeof translations === 'undefined' || !translations[lang]) return;
    const t = translations[lang];

    // Set Document Direction and Font Class
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', t.dir);
    document.body.setAttribute('dir', t.dir);
    
    document.body.classList.remove('font-urdu', 'font-english', 'font-arabic');
    document.body.classList.add(t.fontClass);

    // Update active state in dropdown
    document.querySelectorAll('.lang-option').forEach(opt => {
      if (opt.getAttribute('data-lang') === lang) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });

    // Translate all elements with data-i18n

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        el.innerHTML = t[key];
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (t[key] !== undefined) {
        el.setAttribute('placeholder', t[key]);
      }
    });
  }

  // 2. Mobile Nav Toggle
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const mainNav = document.querySelector('nav.main-nav');

  if (mobileBtn && mainNav) {
    mobileBtn.addEventListener('click', () => {
      mainNav.classList.toggle('active');
      const icon = mobileBtn.querySelector('i');
      if (icon) {
        if (mainNav.classList.contains('active')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-xmark');
        } else {
          icon.classList.remove('fa-xmark');
          icon.classList.add('fa-bars');
        }
      }
    });
  }

  // 3. Admission / Trial Modal
  const modal = document.getElementById('enrollModal');
  const openModalBtns = document.querySelectorAll('.open-enroll-modal');
  const closeModalBtn = document.querySelector('.close-modal');
  const courseSelect = document.getElementById('selectedCourse');

  if (modal) {
    openModalBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const courseName = btn.getAttribute('data-course');
        if (courseSelect && courseName) {
          courseSelect.value = courseName;
        }
        modal.classList.add('active');
      });
    });

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  // 4. Handle Enrollment Submission (Supabase + WhatsApp)
  const enrollForm = document.getElementById('enrollmentForm');
  if (enrollForm) {
    enrollForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current = localStorage.getItem('alquran_lang') || 'ur';
      const studentName = document.getElementById('studentName')?.value.trim() || '';
      const studentAge = document.getElementById('studentAge')?.value.trim() || '';
      const studentCity = document.getElementById('studentCity')?.value.trim() || '';
      const studentEmail = document.getElementById('studentEmail')?.value.trim() || '';
      const course = document.getElementById('selectedCourse')?.value || '';
      const phone = document.getElementById('studentPhone')?.value.trim() || '';
      const note = document.getElementById('studentNote')?.value.trim() || '';

      const submitBtn = enrollForm.querySelector('button[type="submit"]');
      const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جمع کیا جا رہا ہے...';
      }

      // 1. Save to Supabase backend
      let saveSuccess = false;
      if (typeof window.saveAdmission === 'function') {
        const res = await window.saveAdmission({
          student_name: studentName,
          age: studentAge,
          city: studentCity,
          email: studentEmail,
          course: course,
          phone: phone,
          note: note,
          status: 'pending'
        });
        saveSuccess = res.success;
      }

      // 2. Prepare WhatsApp message
      let text = '';
      let successAlert = '';
      if (current === 'en') {
        text = `Assalamu Alaikum!%0AI would like to apply for admission at *Al-Quran Academy for Girls*.%0A*Student Name:* ${encodeURIComponent(studentName)}${studentAge ? `%0A*Age:* ${encodeURIComponent(studentAge)}` : ''}${studentCity ? `%0A*City:* ${encodeURIComponent(studentCity)}` : ''}%0A*Selected Course:* ${encodeURIComponent(course)}%0A*Phone / WhatsApp:* ${encodeURIComponent(phone)}%0A*Preferred Time / Message:* ${encodeURIComponent(note)}`;
        successAlert = 'Thank you! Your admission request has been received in our system. Redirecting to WhatsApp for instant coordination.';
      } else if (current === 'ar') {
        text = `السلام عليكم ورحمة الله وبركاته%0Aأود التسجيل في *أكاديمية القرآن الكريم للبنات*.%0A*اسم الطالبة:* ${encodeURIComponent(studentName)}${studentAge ? `%0A*العمر:* ${encodeURIComponent(studentAge)}` : ''}${studentCity ? `%0A*المدينة:* ${encodeURIComponent(studentCity)}` : ''}%0A*الدورة المطلوبة:* ${encodeURIComponent(course)}%0A*رقم الواتساب:* ${encodeURIComponent(phone)}%0A*الموعد المفضل:* ${encodeURIComponent(note)}`;
        successAlert = 'جزاكم الله خيراً! تم تسجيل طلبكم في النظام بنجاح، جاري تحويلكم إلى الواتساب للتنسيق والمتابعة.';
      } else {
        text = `السلام علیکم و رحمۃ اللہ!%0Aمیں "القرآن اکیڈمی برائے طالبات" میں داخلہ لینا چاہتی ہوں۔%0A*طالبہ کا نام:* ${encodeURIComponent(studentName)}${studentAge ? `%0A*عمر:* ${encodeURIComponent(studentAge)} سال` : ''}${studentCity ? `%0A*شہر:* ${encodeURIComponent(studentCity)}` : ''}%0A*منتخب کورس:* ${encodeURIComponent(course)}%0A*فون نمبر:* ${encodeURIComponent(phone)}%0A*پیغام / ترجیحی وقت:* ${encodeURIComponent(note)}`;
        successAlert = 'جزاکِ اللہ خیراً! آپ کی داخلہ درخواست ڈیٹا بیس میں محفوظ ہو گئی ہے۔ اب آپ کو واٹس ایپ کوارڈینیشن کے لیے منتقل کیا جا رہا ہے۔';
      }

      if (typeof window.showToast === 'function') {
        window.showToast(successAlert, 'success');
      }

      // Open WhatsApp in new tab for direct support coordination
      const whatsappUrl = `https://wa.me/923001234567?text=${text}`;
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 700);

      if (modal) modal.classList.remove('active');
      enrollForm.reset();

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }
    });
  }

  // 5. Handle Contact Message Submission (Supabase)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const current = localStorage.getItem('alquran_lang') || 'ur';
      const name = document.getElementById('contactName')?.value.trim() || '';
      const phone = document.getElementById('contactPhone')?.value.trim() || '';
      const email = document.getElementById('contactEmail')?.value.trim() || '';
      const message = document.getElementById('contactMsg')?.value.trim() || '';

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> بھیجا جا رہا ہے...';
      }

      let saveSuccess = false;
      if (typeof window.saveContactMessage === 'function') {
        const res = await window.saveContactMessage({
          name: name,
          phone: phone,
          email: email,
          message: message
        });
        saveSuccess = res.success;
      }

      if (saveSuccess) {
        let successMsg = 'آپ کا پیغام کامیابی سے موصول ہو گیا ہے! ہماری ٹیم جلد آپ سے رابطہ کرے گی۔';
        if (current === 'en') successMsg = 'Thank you! Your message has been sent successfully. Our team will reach out shortly.';
        else if (current === 'ar') successMsg = 'شكراً لتواصلكم! تم إرسال رسالتكم بنجاح وسيتواصل فريقنا معكم قريباً.';
        
        if (typeof window.showToast === 'function') {
          window.showToast(successMsg, 'success');
        } else {
          alert(successMsg);
        }
        contactForm.reset();
      } else {
        let errorMsg = 'پیغام بھیجنے میں خرابی ہوئی۔ برائے مہربانی واٹس ایپ پر رابطہ فرمائیں۔';
        if (current === 'en') errorMsg = 'Could not send message. Please contact us directly via WhatsApp.';
        else if (current === 'ar') errorMsg = 'تعذر إرسال الرسالة. يرجى التواصل مباشرة عبر الواتساب.';
        
        if (typeof window.showToast === 'function') {
          window.showToast(errorMsg, 'error');
        } else {
          alert(errorMsg);
        }
      }

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
      }
    });
  }
});
