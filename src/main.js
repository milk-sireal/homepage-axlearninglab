document.querySelector('#year').textContent = new Date().getFullYear();

// A mailto link opens a draft in the visitor's mail app; no data is sent by this site.
const makeInquiry = (course = '미정') => {
  const interest = course === '미정' ? '미정 (상담 후 결정)' : course;
  const subject = `AX러닝랩 ${course === '미정' ? '교육·컨설팅' : course} 문의`;
  const body = `안녕하세요. AX러닝랩 교육·컨설팅을 문의합니다.\n\n회사명 / 담당자:\n관심 과정: ${interest}\n교육 대상 / 인원:\n교육 목표 / 업무 과제:\n희망 일정:\n희망 진행 방식:\n기타 문의:\n\n아직 정해지지 않은 항목은 ‘미정’으로 작성해 주세요.`;
  return `mailto:contact@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
document.querySelectorAll('.inquiry-link, [data-course]').forEach(link => {
  link.href = makeInquiry(link.dataset.course);
});

const copyButton = document.querySelector('.copy-email');
copyButton.addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText('contact@example.com');
    status.textContent = '이메일 주소를 복사했습니다.';
  } catch {
    status.textContent = '복사하지 못했습니다. 위 이메일 주소를 선택해 복사해 주세요.';
  }
});

const links = [...document.querySelectorAll('nav a')];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) links.forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-20% 0px -55% 0px' });
document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
