document.addEventListener('DOMContentLoaded', () => {
  // Setup FAQ accordions
  const faqs = document.querySelectorAll('.section .container > div[style*="flex-direction: column"] > div');
  
  faqs.forEach(faq => {
    const header = faq.querySelector('h4');
    const content = faq.querySelector('p');
    const icon = faq.querySelector('i');
    
    // Style adjustments
    faq.style.cursor = 'pointer';
    faq.style.transition = 'all 0.3s ease';
    
    faq.addEventListener('click', () => {
      const isVisible = content.style.display !== 'none';
      
      // Close all others
      faqs.forEach(otherFaq => {
        otherFaq.querySelector('p').style.display = 'none';
        otherFaq.querySelector('i').className = 'ph ph-caret-down';
        otherFaq.style.borderColor = 'var(--border)';
      });
      
      if (!isVisible) {
        content.style.display = 'block';
        icon.className = 'ph ph-caret-up';
        faq.style.borderColor = 'var(--primary)';
      }
    });
  });
});
