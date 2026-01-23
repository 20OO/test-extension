document.getElementById('startPiP').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: initPiPSelection
  });
  window.close(); // Đóng popup sau khi nhấn
});

async function initPiPSelection() {
  // Kiểm tra trình duyệt có hỗ trợ không
  if (!('documentPictureInPicture' in window)) {
    alert("Trình duyệt của bạn chưa hỗ trợ Document Picture-in-Picture API.");
    return;
  }

  alert("Hãy click vào phần tử bạn muốn đưa vào Picture-in-Picture");

  const onMouseOver = (e) => {
    e.target.style.outline = '2px solid red';
    e.stopPropagation();
  };

  const onMouseOut = (e) => {
    e.target.style.outline = '';
    e.stopPropagation();
  };

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Dọn dẹp sự kiện sau khi chọn
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('mouseout', onMouseOut, true);
    document.removeEventListener('click', onClick, true);
    e.target.style.outline = '';

    const targetElement = e.target;

    // Kích hoạt Document PiP
    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width: targetElement.clientWidth,
      height: targetElement.clientHeight,
    });

    // Copy Styles để element hiển thị đúng trong cửa sổ mới
    const allStyleSheets = [...document.styleSheets];
    allStyleSheets.forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
        const style = document.createElement('style');
        style.textContent = cssRules;
        pipWindow.document.head.appendChild(style);
      } catch (e) {
        // Xử lý các style từ domain khác (CORS)
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleSheet.href;
        pipWindow.document.head.appendChild(link);
      }
    });

    // Di chuyển element vào cửa sổ PiP
    pipWindow.document.body.appendChild(targetElement);

    // Trả lại element khi đóng cửa sổ PiP
    pipWindow.addEventListener("pagehide", (event) => {
      const container = document.body; // Hoặc một vị trí cụ thể bạn muốn
      container.appendChild(targetElement);
    });
  };

  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('click', onClick, true);
}
