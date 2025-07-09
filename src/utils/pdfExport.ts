import jsPDF from 'jspdf';
import { Scenario, UserResponse } from '../types';

interface Scores {
  compliance: number;
  stakeholder: number;
  business: number;
  time: number;
}

export function exportToPdf(scenario: Scenario, responses: UserResponse[], scores: Scores) {
  const doc = new jsPDF();
  let yPos = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - (margin * 2);

  // Helper function for text wrapping
  const addWrappedText = (text: string, y: number, maxWidth: number = contentWidth) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, margin, y);
    return (lines.length * 7); // Approximate height of text block
  };

  // Helper function to draw a box with rounded corners
  const drawBox = (x: number, y: number, width: number, height: number, radius: number = 3) => {
    doc.roundedRect(x, y - height + 3, width, height, radius, radius);
  };

  // Title Section
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Simulation Results', margin, yPos);
  yPos += 15;

  // Scenario Details
  doc.setFontSize(16);
  doc.text(scenario.title, margin, yPos);
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  yPos += addWrappedText(scenario.description, yPos);
  yPos += 15;

  // Score Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Metrics', margin, yPos);
  yPos += 10;

  // Draw score boxes in a grid
  const boxWidth = (contentWidth - 15) / 2;
  const boxHeight = 30;
  const metrics = [
    { label: 'Compliance', score: scores.compliance, color: [0, 87, 255] }, // Blue
    { label: 'Stakeholder Management', score: scores.stakeholder, color: [34, 197, 94] }, // Green
    { label: 'Business Impact', score: scores.business, color: [147, 51, 234] }, // Purple
    { label: 'Time Management', score: scores.time, color: [249, 115, 22] }, // Orange
  ];

  metrics.forEach((metric, index) => {
    const row = Math.floor(index / 2);
    const col = index % 2;
    const x = margin + (col * (boxWidth + 15));
    const y = yPos + (row * (boxHeight + 10));

    // Draw box background
    doc.setFillColor(metric.color[0], metric.color[1], metric.color[2], 0.1);
    drawBox(x, y + boxHeight, boxWidth, boxHeight);
    doc.setFillColor(...metric.color);

    // Add metric label and score
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, x + 10, y + 7);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${metric.score}%`, x + 10, y + 25);
  });

  yPos += 85;

  // Decision Timeline
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Decision Path', margin, yPos);
  yPos += 10;

  // Decisions and Responses
  responses.forEach((response, index) => {
    const decision = scenario.timeline.find(d => d.id === response.decisionId);
    const selectedOption = decision?.options.find(o => o.id === response.optionId);

    if (!decision || !selectedOption) return;

    // Add new page if needed
    if (yPos > doc.internal.pageSize.height - 50) {
      doc.addPage();
      yPos = 20;
    }

    // Draw timeline dot and line
    doc.setFillColor(59, 130, 246); // Blue
    doc.circle(margin + 4, yPos + 4, 4, 'F');
    if (index < responses.length - 1) {
      doc.setDrawColor(229, 231, 235); // Gray
      doc.line(margin + 4, yPos + 8, margin + 4, yPos + 50);
    }

    // Decision point content
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Decision Point ${index + 1}`, margin + 15, yPos);
    yPos += 7;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    yPos += addWrappedText(decision.text, yPos, contentWidth - 20);
    yPos += 7;

    // Selected option box
    doc.setFillColor(249, 250, 251); // Light gray
    drawBox(margin + 15, yPos + 25, contentWidth - 35, 25);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    yPos += addWrappedText(selectedOption.text, yPos, contentWidth - 40);
    yPos += 7;

    // Response details
    doc.setFontSize(10);
    doc.text(`Response Time: ${response.responseTime}s`, margin + 15, yPos);
    doc.text(`Confidence Level: ${response.confidenceLevel}/5`, margin + 100, yPos);
    yPos += 15;

    if (selectedOption.feedback) {
      doc.setFont('helvetica', 'italic');
      yPos += addWrappedText(selectedOption.feedback, yPos, contentWidth - 40);
      yPos += 7;
    }

    yPos += 10;
  });

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175); // Gray
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} | ${scenario.type} Scenario`,
    margin,
    doc.internal.pageSize.height - 10
  );

  // Save the PDF
  doc.save(`crisis-response-${scenario.id}-${Date.now()}.pdf`);
}