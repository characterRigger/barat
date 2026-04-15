document.addEventListener('DOMContentLoaded', async () => {
  setupHomePosterSlider();
  setupToolsSlider();
  setupContactForm();
});

async function setupHomePosterSlider() {
  const slider = document.getElementById('home-poster-slider');
  const prevBtn = document.getElementById('poster-prev');
  const nextBtn = document.getElementById('poster-next');

  if (!slider || !prevBtn || !nextBtn) return;

  try {
    const response = await fetch('./posters.json');
    if (!response.ok) throw new Error('Could not load posters.json');
    const posters = await response.json();

    if (!Array.isArray(posters) || posters.length === 0) {
      slider.innerHTML = '<p class="note">No posters were found in posters.json.</p>';
      return;
    }

    slider.innerHTML = `
      <div class="wide-poster-track">
        ${posters.map((poster) => `
          <article class="wide-poster-card">
            <img src="${poster.src}" alt="${poster.alt}">
            <div class="wide-poster-title">
              <h2>${poster.alt}</h2>
            </div>
          </article>
        `).join('')}
      </div>
    `;

    const track = slider.querySelector('.wide-poster-track');
    let autoplay;

    function getScrollAmount() {
      const card = track.querySelector('.wide-poster-card');
      return card ? card.offsetWidth + 22 : 420;
    }

    function scrollNext() {
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 8) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
      }
    }

    function scrollPrev() {
      if (track.scrollLeft <= 8) {
        track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
      }
    }

    function startAutoplay() {
      autoplay = setInterval(scrollNext, 4200);
    }

    function resetAutoplay() {
      clearInterval(autoplay);
      startAutoplay();
    }

    prevBtn.addEventListener('click', () => {
      scrollPrev();
      resetAutoplay();
    });

    nextBtn.addEventListener('click', () => {
      scrollNext();
      resetAutoplay();
    });

    slider.addEventListener('mouseenter', () => clearInterval(autoplay));
    slider.addEventListener('mouseleave', startAutoplay);

    startAutoplay();
  } catch (error) {
    slider.innerHTML = '<p class="note">Poster slider could not be loaded. Make sure posters.json is present and the poster image paths are correct.</p>';
    console.error(error);
  }
}

async function setupToolsSlider() {
  const slider = document.getElementById('tools-slider');
  const dotsWrap = document.getElementById('slider-dots');
  const thumbsWrap = document.getElementById('tools-thumbs');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');

  if (!slider || !dotsWrap || !thumbsWrap || !prevBtn || !nextBtn) return;

  try {
    const response = await fetch('./tools.json');
    if (!response.ok) throw new Error('Could not load tools.json');
    const items = await response.json();

    if (!Array.isArray(items) || items.length === 0) {
      slider.innerHTML = '<p class="note">No rigging development tools media has been added yet.</p>';
      return;
    }

    slider.innerHTML = items.map((item, index) => {
      let media = '';

      if (item.type === 'youtube') {
        media = `<iframe
          src="${item.src}"
          title="${item.title}"
          loading="${index === 0 ? 'eager' : 'lazy'}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>`;
      } else if (item.type === 'video') {
        media = `<video controls playsinline preload="${index === 0 ? 'metadata' : 'none'}">
          <source src="${item.src}" type="video/mp4">
          Your browser does not support the video tag.
        </video>`;
      } else {
        media = `<img src="${item.src}" alt="${item.title}">`;
      }

      const points = (item.points || []).map(point => `<li>${point}</li>`).join('');

      return `
        <article class="simple-tools-slide ${index === 0 ? 'active' : ''}">
          ${media}
          <div class="simple-tools-caption">
            <h2>${item.title}</h2>
            <p>${item.description || ''}</p>
            ${points ? `<ul>${points}</ul>` : ''}
          </div>
        </article>
      `;
    }).join('');

    dotsWrap.innerHTML = items.map((_, index) => `<button data-index="${index}"></button>`).join('');
    thumbsWrap.innerHTML = '';

    const slides = Array.from(slider.querySelectorAll('.simple-tools-slide'));
    const dots = Array.from(dotsWrap.querySelectorAll('button'));
    let current = 0;
    let autoplay;

    function stopAllMedia() {
      slides.forEach(slide => {
        const video = slide.querySelector('video');
        if (video) video.pause();

        const iframe = slide.querySelector('iframe');
        if (iframe) {
          const src = iframe.src;
          iframe.src = src;
        }
      });
    }

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === current);
      });
      stopAllMedia();
    }

    function startAutoplay() {
      autoplay = setInterval(() => showSlide(current + 1), 6500);
    }

    function resetAutoplay() {
      clearInterval(autoplay);
      startAutoplay();
    }

    prevBtn.addEventListener('click', () => {
      showSlide(current - 1);
      resetAutoplay();
    });

    nextBtn.addEventListener('click', () => {
      showSlide(current + 1);
      resetAutoplay();
    });

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        showSlide(Number(dot.dataset.index));
        resetAutoplay();
      });
    });

    slider.addEventListener('mouseenter', () => clearInterval(autoplay));
    slider.addEventListener('mouseleave', startAutoplay);

    showSlide(0);
    startAutoplay();
  } catch (error) {
    slider.innerHTML = '<p class="note">Slider media could not be loaded. Check tools.json and your YouTube links.</p>';
    console.error(error);
  }
}

async function sendFormspreeForm(form, status) {
  const action = form.getAttribute('action') || '';

  if (!action.includes('formspree.io/f/') || action.includes('yourformid')) {
    status.textContent = 'Add your real Formspree form URL in contact.html before this form can send messages.';
    status.className = 'form-status error';
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;

  try {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    status.textContent = 'Sending your message...';
    status.className = 'form-status';

    const response = await fetch(action, {
      method: 'POST',
      body: new FormData(form),
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Form submission failed');
    }

    form.reset();
    status.textContent = 'Thanks. Your message was sent successfully.';
    status.className = 'form-status success';
  } catch (error) {
    console.error(error);
    status.textContent = 'Sorry, something went wrong while sending the message.';
    status.className = 'form-status error';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

function setupContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');

  if (!form || !status) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await sendFormspreeForm(form, status);
  });
}
