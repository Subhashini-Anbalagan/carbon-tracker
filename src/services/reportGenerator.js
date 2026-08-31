import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const generateCarbonReportPDF = async (
  elementId,
  fileName = "EcoTrack-Report.pdf",
  scrollContainerId = "report-scroll-container"
) => {
  const node = document.getElementById(elementId);
  if (!node) {
    throw new Error(`generateCarbonReportPDF: no element found with id "${elementId}"`);
  }

  // The report sits inside a div with overflow-y: auto (the scrollable page
  // body). html2canvas clips its capture to whatever's currently visible
  // inside a scrolled ancestor, so temporarily un-clip that REAL DOM node
  // (not a clone — mutating the clone's flex containers collapses the
  // layout instead) for the duration of the capture, then restore it.
  const scrollContainer = document.getElementById(scrollContainerId);
  const prevStyle = scrollContainer
    ? {
        overflow: scrollContainer.style.overflow,
        height: scrollContainer.style.height,
        maxHeight: scrollContainer.style.maxHeight,
      }
    : null;

  if (scrollContainer) {
    scrollContainer.style.overflow = "visible";
    scrollContainer.style.height = "auto";
    scrollContainer.style.maxHeight = "none";
  }

  let canvas;
  try {
    canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        // html2canvas clones the DOM into a fresh iframe, which restarts CSS
        // animations — the fadeUp animation gets sampled near its opacity:0
        // starting frame instead of its finished, fully-opaque state.
        clonedDoc.querySelectorAll(".report-section").forEach((el) => {
          el.style.animation = "none";
          el.style.opacity = "1";
        });
      },
    });
  } finally {
    if (scrollContainer && prevStyle) {
      scrollContainer.style.overflow = prevStyle.overflow;
      scrollContainer.style.height = prevStyle.height;
      scrollContainer.style.maxHeight = prevStyle.maxHeight;
    }
  }

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(fileName);
};