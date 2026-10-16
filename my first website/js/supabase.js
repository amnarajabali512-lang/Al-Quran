// Supabase Backend Integration for Al-Quran Academy for Girls
const SUPABASE_URL = "https://gnqdpmmpcxsftgbutcrk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducWRwbW1wY3hzZnRnYnV0Y3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNTI0NTEsImV4cCI6MjEwNzYyODQ1MX0._odZkx_whDOVWjKPxtG7XQyjzwlFhcdiC-6bvFk7n2s";

// Initialize Supabase Client
let supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase SDK not loaded yet. Make sure to include supabase-js before supabase.js");
}

/**
 * Toast notification system
 * @param {string} message - Message to display
 * @param {'success'|'error'|'info'} type - Type of toast
 */
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 25px;
      right: 25px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 90vw;
      width: 380px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl' || !document.documentElement.getAttribute('dir');
  const bg = type === 'success' ? '#0f5132' : type === 'error' ? '#842029' : '#055160';
  const border = type === 'success' ? '#d4af37' : type === 'error' ? '#ea868f' : '#b6effb';
  const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info';

  toast.style.cssText = `
    background: ${bg};
    color: #ffffff;
    border-inline-start: 5px solid ${border};
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    font-size: 0.95rem;
    line-height: 1.6;
    display: flex;
    align-items: center;
    gap: 12px;
    direction: ${isRTL ? 'rtl' : 'ltr'};
    pointer-events: auto;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="font-size: 1.3rem; color: ${border}; flex-shrink: 0;"></i>
    <div style="flex: 1;">${message}</div>
    <button style="background: none; border: none; color: #fff; cursor: pointer; font-size: 1.1rem; opacity: 0.7; padding: 0 4px;" aria-label="Close">&times;</button>
  `;

  toastContainer.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  const removeToast = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  };

  const closeBtn = toast.querySelector('button');
  if (closeBtn) closeBtn.addEventListener('click', removeToast);

  // Auto remove after 5.5s
  setTimeout(removeToast, 5500);
}

/**
 * Save Admission / Trial Registration to Supabase
 * @param {Object} data 
 * @returns {Promise<{success: boolean, error: any}>}
 */
async function saveAdmission(data) {
  if (!supabaseClient) {
    console.error("Supabase client is not initialized.");
    return { success: false, error: "Database client not available" };
  }

  try {
    const payload = {
      student_name: data.student_name,
      age: data.age ? parseInt(data.age, 10) : null,
      city: data.city || null,
      email: data.email || null,
      course: data.course || 'جنرل داخلہ',
      phone: data.phone,
      note: data.note || null,
      status: data.status || 'pending'
    };

    let { error } = await supabaseClient
      .from('admissions')
      .insert([payload]);

    if (error && error.message && error.message.includes("column of 'admissions'")) {
      console.warn("Table does not have email/status column yet, falling back gracefully...");
      const fallbackPayload = {
        student_name: data.student_name,
        age: data.age ? parseInt(data.age, 10) : null,
        city: data.city || null,
        course: data.course || 'جنرل داخلہ',
        phone: data.phone,
        note: (data.note || '') + (data.email ? ` [Email: ${data.email}]` : '')
      };
      const retry = await supabaseClient.from('admissions').insert([fallbackPayload]);
      if (!retry.error) {
        return { success: true };
      }
      error = retry.error;
    }

    if (error) {
      console.error("Supabase admission insert error:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Exception during admission submission:", err);
    return { success: false, error: err };
  }
}

/**
 * Update Admission Application Status (pending, confirmed, rejected)
 * @param {number|string} id
 * @param {'pending'|'confirmed'|'rejected'} newStatus
 * @returns {Promise<{success: boolean, error: any}>}
 */
async function updateAdmissionStatus(id, newStatus) {
  if (!supabaseClient) return { success: false, error: "Database not connected" };
  try {
    const { error } = await supabaseClient
      .from('admissions')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error("Status update error:", error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Send Student Confirmation Email via Web3Forms or direct webhook
 * @param {Object} details
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendStudentEmailNotification({ student_name, student_email, course, status, message }) {
  if (!student_email) {
    return { success: false, message: 'طالبہ کا ای میل موجود نہیں ہے۔' };
  }

  // Get Web3Forms access key from localStorage (or fallback)
  const web3Key = localStorage.getItem('alquran_web3forms_key');
  if (!web3Key) {
    console.warn("Web3Forms Access Key not set in Admin Settings.");
    return { 
      success: false, 
      needsKey: true,
      message: 'براہِ کرم ایڈمن ڈیش بورڈ میں اپنا مفت Web3Forms Access Key سیو فرمائیں۔'
    };
  }

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: web3Key,
        from_name: "القرآن اکیڈمی برائے طالبات",
        subject: `القرآن اکیڈمی: ${student_name} کا داخلہ کنفرم ہو گیا ہے!`,
        to: student_email,
        replyto: "info@alquranacademy.com",
        message: message || `
السلام علیکم و رحمۃ اللہ و برکاتہ!
محترم ${student_name}،
مبارک ہو! "القرآن اکیڈمی برائے طالبات" میں آپ کا کورس (${course}) کے لیے داخلہ کامیابی سے منظور (Confirm) کر لیا گیا ہے۔
ہماری معلمات آپ سے آن لائن کلاسز اور شیڈول کے متعلق جلد واٹس ایپ پر رابطہ فرمائیں گی۔
جزاکم اللہ خیراً و احسن الجزاء۔
القرآن اکیڈمی برائے طالبات
        `
      }),
    });

    const result = await response.json();
    if (result.success) {
      return { success: true, message: 'طالبہ کو تصدیقی ای میل کامیابی سے بھیج دی گئی ہے!' };
    } else {
      return { success: false, message: result.message || 'ای میل بھیجنے میں رکاوٹ آئی۔' };
    }
  } catch (err) {
    console.error("Web3Forms error:", err);
    return { success: false, message: err.message || 'نیٹ ورک کی خرابی۔' };
  }
}

/**
 * Save Contact Inquiry Message to Supabase
 * @param {Object} data
 * @returns {Promise<{success: boolean, error: any}>}
 */
async function saveContactMessage(data) {
  if (!supabaseClient) {
    console.error("Supabase client is not initialized.");
    return { success: false, error: "Database client not available" };
  }

  try {
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message: data.message
    };

    const { error } = await supabaseClient
      .from('contact_messages')
      .insert([payload]);

    if (error) {
      console.error("Supabase contact_messages insert error:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Exception during contact message submission:", err);
    return { success: false, error: err };
  }
}

// Make functions globally available
window.saveAdmission = saveAdmission;
window.updateAdmissionStatus = updateAdmissionStatus;
window.sendStudentEmailNotification = sendStudentEmailNotification;
window.saveContactMessage = saveContactMessage;
window.showToast = showToast;
window.supabaseClient = supabaseClient;
