'use strict';

const path = require('path');
const fs   = require('fs');
const PDFDocument = require('pdfkit');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, convertInchesToTwip,
} = require('docx');

const { OfferLetterPosition, OfferLetterAddress, EmployeeApplication } = require('../models');

// ── Positions ─────────────────────────────────────────────────────────────────

const listPositions = async (req, res) => {
  try {
    const positions = await OfferLetterPosition.findAll({ order: [['name', 'ASC']] });
    return res.json({ positions });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const findOrCreatePosition = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Position name is required.' });
    const [position, created] = await OfferLetterPosition.findOrCreate({
      where: { name: name.trim() },
      defaults: { name: name.trim() },
    });
    return res.status(created ? 201 : 200).json({ position, created });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Addresses ─────────────────────────────────────────────────────────────────

const listAddresses = async (req, res) => {
  try {
    const addresses = await OfferLetterAddress.findAll({ order: [['name', 'ASC']] });
    return res.json({ addresses });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const findOrCreateAddress = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Address is required.' });
    const [address, created] = await OfferLetterAddress.findOrCreate({
      where: { name: name.trim() },
      defaults: { name: name.trim() },
    });
    return res.status(created ? 201 : 200).json({ address, created });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Shared data builder ───────────────────────────────────────────────────────

const buildLetterData = (application, body) => {
  const { position, office_address, start_date, employment_type, salary } = body;

  const salaryFormatted = `${Number(salary).toLocaleString('en-IN')}.00`;
  const salaryFormula   = `[(${salaryFormatted} INR / 30) x Total no. of leaves for that month.]`;
  const gender          = application.gender;
  const salutation      = gender === 'female' ? 'Ms.' : 'Mr.';
  const fullName        = `${application.first_name} ${application.last_name}`;

  const employmentLabel = {
    fulltime:       'Full Time',
    halftime:       'Half Time',
    work_from_home: 'Work From Home',
  }[employment_type] || employment_type;

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const startDateFmt = new Date(start_date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return {
    salaryFormatted, salaryFormula, salutation, fullName,
    employmentLabel, today, startDateFmt, position,
    office_address,
    address: application.address,
    phone:   application.phone,
    display_id: application.display_id,
  };
};

// ── PDF generator (pdfkit) ────────────────────────────────────────────────────

const generatePDF = (d) => {
  return new Promise((resolve, reject) => {
    // 1. Reduced margins to 50pt to prevent overflow pushing onto 3 pages
    const MARGIN = 50; 
    const doc    = new PDFDocument({ margin: MARGIN, size: 'A4' });
    const chunks = [];
    doc.on('data',  (c) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const PAGE_WIDTH  = doc.page.width;
    const TEXT_WIDTH  = PAGE_WIDTH - MARGIN * 2;

    const blue  = '#132ea7';
    const black = '#1a1a1a';
    const S     = 9.5; // Slightly reduced font size for clean 2-page fit
    const HS    = 10.5;

    // ── helpers ──────────────────────────────────────────────────────────────

    const nl = (n = 0.3) => doc.moveDown(n);

const bullet = (str, font = 'Helvetica') => {
  const bulletX = MARGIN + 8;
  const textX   = MARGIN + 20;
  const textW   = TEXT_WIDTH - 20;
  const startY  = doc.y;

  // Draw bullet dot
  doc.font('Helvetica').fontSize(S).fillColor(black)
     .text('•', bulletX, startY, { width: 10, lineBreak: false });

  // Draw bullet text with matching start Y
  doc.font(font).fontSize(S).fillColor(black)
     .text(str, textX, startY, { width: textW, align: 'left' });

  // Move down based on the height of the rendered paragraph
  nl(0.15);
};

// Heading helper ensuring explicit X coordinate reset
const heading = (str) => {
  nl(0.4);
  doc.font('Helvetica-Bold').fontSize(HS).fillColor(blue)
     .text(str, MARGIN, doc.y, { width: TEXT_WIDTH });
  doc.fillColor(black);
  nl(0.2);
};

// Write text helper resetting X coordinate
const writeText = (str, font = 'Helvetica', size = S, color = black, opts = {}) => {
  doc.font(font).fontSize(size).fillColor(color)
     .text(str, MARGIN, doc.y, { width: TEXT_WIDTH, ...opts });
};
    // ── Content ──────────────────────────────────────────────────────────────

    // Date — right aligned
    doc.font('Helvetica-Bold').fontSize(S).fillColor(black)
       .text(`Date: ${d.today}`, { width: TEXT_WIDTH, align: 'right' });
    nl(0.3);

    writeText('Private and Confidential', 'Helvetica-Bold');
    nl(0.1);
    writeText(`Name: ${d.fullName}`, 'Helvetica-Bold');
    writeText(`Add : ${d.address}`, 'Helvetica-Bold');
    writeText(`Mob : ${d.phone}`, 'Helvetica-Bold');
    nl(0.4);

    // Title
    doc.font('Helvetica-Bold').fontSize(13).fillColor(blue)
       .text('OFFER LETTER', { width: TEXT_WIDTH, align: 'center' });
    doc.fillColor(black);
    nl(0.4);

    writeText('Dear,', 'Helvetica-Bold');
    nl(0.1);
    writeText(`${d.salutation} ${d.fullName}`, 'Helvetica-Bold');
    nl(0.3);

    writeText(`I am pleased to offer you employment in the position of ${d.position} with us at`);
    nl(0.1);
    writeText('Blue Bell Compuserve Pvt. Ltd.', 'Helvetica-Bold');
    writeText(`Add: ${d.office_address}`);
    nl(0.3);

    // ── Position ──
    heading('Position');
    bullet(`Your start date will be ${d.startDateFmt}`);
    bullet(`Your employment will be ${d.employmentLabel}.`);
    bullet('You will be required to perform these duties, and any other duties the employer may assign to you, having regard to your skills, training and experience.');
    bullet('You will be required to perform your duties at our organization or elsewhere as reasonably directed by the employer.');
    bullet("You need to perform your duty as per company's rules and Regulation.");

    // ── Probation ──
    heading('Probation');
    bullet('A probation period will apply for the first six months of your employment. During the period we will assess your progress and performance in the position.');
    bullet('The additional terms and conditions set out by the company will also apply to your employment.');

    // ── Ordinary hours ──
    heading('Ordinary hours of work');
    bullet('Your ordinary hours of work will be six days per week for eight and half hours, plus any reasonable additional hours that are necessary to fulfill your duties or as otherwise required by the employer.');

    // ── Remuneration ──
    heading('Remuneration');
    bullet(`You will be paid ${d.salaryFormatted} INR per month.`);
    bullet("Your remuneration will be reviewed annually and may be increased at the employer's discretion.");

    // ── Leave ──
    heading('Leave');
    bullet("No leave will be allowed during First six Months' Probation Period, leave taken during this period will be counted as Leave Without Pay.");
    bullet('You are allowed to get 2 paid leaves per month including sick leave after probation period.');
    bullet(`Once you use all paid your leave, pay for any additional leave will be deductible from your monthly pay. (Formula for deduction of pay for additional leaves is ${d.salaryFormula})`);

    // ── Obligations ──
    heading('Your obligations to the employer');
    bullet('Perform all duties to the best of your ability at all times;');
    bullet('Use your best endeavors to promote and protect the interests of the employer; and');
    bullet('In case of resignation, you are required to provide a two-month prior notice. Failure to do so will result in a deduction of salary equivalent to the notice period shortfall.');
    bullet('One-year bond period will be start after six-month probation period.');
    bullet('Your employer will also provide you one-month prior notice before termination of your employment contract.');
    bullet('If you wish to terminate your employment you are not allowed to work with our client or in the same industries unless there is no obligation from your employer.');

    // ── Confidentiality ──
    heading('Confidentiality');
    bullet('By accepting this letter of offer, you acknowledge and agree that you will not, during the course of your employment or thereafter, except with the consent of the employer, as required by law or in the performance of your duties, use or disclose confidential information relating to the business of the employer, including but not limited to client lists, trade secrets, client details and pricing structures.');

    // ── Entire agreement ──
    heading('Entire agreement');
    bullet('The terms and conditions referred to in this letter constitute all of the terms and conditions of your employment and replace any prior understanding or agreement between you and the employer.');
    bullet('The terms and conditions referred to in this letter may only be varied by a written agreement.');

    nl(0.4);
    writeText('Signed by both you and the employer.');
    nl(0.4);
    writeText('If you have any questions about the terms and conditions of employment, please do not hesitate to contact Mayur Patel - 9727117623.');
    nl(0.8);

    writeText('Yours sincerely,', 'Helvetica-Bold');
    nl(0.1);
    writeText('Mayur Patel.', 'Helvetica-Bold');
    writeText('For, Blue Bell Compuserve Pvt. Ltd.');
    nl(0.8);

    writeText('I have read and understood this letter and accept the offer of employment from Blue Bell Compuserve Pvt. Ltd. on the terms and conditions set out in the letter.');
    nl(0.8);
    writeText('Signed: ____________________          Date: ____________________');

    doc.end();
  });
};

// ── DOCX generator ────────────────────────────────────────────────────────────

const generateDOCX = async (d) => {
  const bold   = (text, size = 22) => new TextRun({ text, bold: true, size });
  const normal = (text, size = 22) => new TextRun({ text, size });
  const para   = (children, alignment = AlignmentType.LEFT, spacing = { after: 120 }) =>
    new Paragraph({ children, alignment, spacing });
  const heading = (text) =>
    new Paragraph({
      children: [bold(text, 24)],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
    });
  const bullet = (children) =>
    new Paragraph({ children, bullet: { level: 0 }, spacing: { after: 80 } });

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left:   convertInchesToTwip(1.25),
            right:  convertInchesToTwip(1.25),
          },
        },
      },
      children: [
        para([bold(`Date: ${d.today}`)], AlignmentType.RIGHT),
        para([normal('')], AlignmentType.LEFT, { after: 60 }),
        para([bold('Private and Confidential')]),
        para([bold(`Name: ${d.fullName}`)]),
        para([bold(`Add : ${d.address}`)]),
        para([bold(`Mob: ${d.phone}`)]),
        para([normal('')], AlignmentType.LEFT, { after: 60 }),
        para([bold('OFFER LETTER', 26)], AlignmentType.CENTER),
        para([bold('Dear,')]),
        para([bold(`${d.salutation} ${d.fullName}`)]),
        para([normal('')], AlignmentType.LEFT, { after: 60 }),
        para([normal(`I am pleased to offer you employment in the position of `), bold(d.position), normal(' with us at')]),
        para([bold('Blue Bell Compuserve Pvt. Ltd.'), normal(`  Add: ${d.office_address}`)]),

        heading('Position'),
        bullet([normal('Your start date will be '), bold(d.startDateFmt)]),
        bullet([normal('Your employment will be '), bold(d.employmentLabel), normal('.')]),
        bullet([normal('You will be required to perform these duties, and any other duties the employer may assign to you, having regard to your skills, training and experience.')]),
        bullet([normal('You will be required to perform your duties at our organization or elsewhere as reasonably directed by the employer.')]),
        bullet([normal("You need to perform your duty as per company's rules and Regulation.")]),

        heading('Probation'),
        bullet([normal('A probation period will apply for the first six months of your employment. During the period we will assess your progress and performance in the position.')]),
        bullet([normal('The additional terms and conditions set out by the company will also apply to your employment.')]),

        heading('Ordinary hours of work'),
        bullet([normal('Your ordinary hours of work will be '), bold('six days per week for eight and half hours'), normal(', plus any reasonable additional hours that are necessary to fulfill your duties or as otherwise required by the employer.')]),

        heading('Remuneration'),
        bullet([normal('You will be paid '), bold(`${d.salaryFormatted} INR`), normal(' per month.')]),
        bullet([normal("Your remuneration will be reviewed annually and may be increased at the employer's discretion.")]),

        heading('Leave'),
        bullet([normal("No leave will be allowed during First six Months' Probation Period, leave taken during this period will be counted as Leave Without Pay.")]),
        bullet([normal('You are allowed to get 2 paid leaves per month including sick leave after probation period.')]),
        bullet([normal('Once you use all paid your leave, pay for any additional leave will be deductible from your monthly pay. (Formula for deduction of pay for additional leaves is '), bold(d.salaryFormula), normal(')')]),

        heading('Your obligations to the employer'),
        bullet([normal('Perform all duties to the best of your ability at all times;')]),
        bullet([normal('Use your best endeavors to promote and protect the interests of the employer; and')]),
        bullet([normal('In case of resignation, you are required to provide a '), bold('two-month prior notice'), normal('. Failure to do so will result in a deduction of salary equivalent to the notice period shortfall.')]),
        bullet([normal('One-year bond period will be start after six-month probation period.')]),
        bullet([normal('Your employer will also provide you one-month prior notice before termination of your employment contract.')]),
        bullet([normal('If you wish to terminate your employment you are not allowed to work with our client or in the same industries unless there is no obligation from your employer.')]),

        heading('Confidentiality'),
        bullet([normal('By accepting this letter of offer, you acknowledge and agree that you will not, during the course of your employment or thereafter, except with the consent of the employer, as required by law or in the performance of your duties, use or disclose confidential information relating to the business of the employer, including but not limited to client lists, trade secrets, client details and pricing structures.')]),

        heading('Entire agreement'),
        bullet([normal('The terms and conditions referred to in this letter constitute all of the terms and conditions of your employment and replace any prior understanding or agreement between you and the employer.')]),
        bullet([normal('The terms and conditions referred to in this letter may only be varied by a written agreement.')]),

        para([normal('Signed by both you and the employer.')], AlignmentType.LEFT, { before: 60, after: 400 }),
        para([bold('If you have any questions about the terms and conditions of employment, please do not hesitate to contact Mayur Patel - 9727117623.')]),
        para([normal('')], AlignmentType.LEFT, { after: 400 }),
        para([bold('Yours sincerely,')]),
        para([bold('Mayur Patel.')]),
        para([normal('For, Blue Bell Compuserve Pvt. Ltd.')]),
        para([normal('')], AlignmentType.LEFT, { after: 400 }),
        para([normal('I have read and understood this letter and accept the offer of employment from Blue Bell Compuserve Pvt. Ltd. on the terms and conditions set out in the letter.')]),
        para([normal('')], AlignmentType.LEFT, { after: 240 }),
        para([normal('Signed: ____________________          Date: ____________________')]),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
};

// ── Main generate endpoint ────────────────────────────────────────────────────

const generateOfferLetter = async (req, res) => {
  try {
    const { application_id } = req.params;
    const {
      position, office_address, start_date,
      employment_type, salary,
      format = 'pdf',
    } = req.body;

    if (!position || !office_address || !start_date || !employment_type || !salary) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const application = await EmployeeApplication.findByPk(application_id);
    if (!application) return res.status(404).json({ message: 'Application not found.' });

    const d = buildLetterData(application, { position, office_address, start_date, employment_type, salary });

    const outputDir = path.join(
      process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads'),
      'offer-letters'
    );
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    let buffer, ext, mimeType;

    if (format === 'docx') {
      buffer   = await generateDOCX(d);
      ext      = 'docx';
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      buffer   = await generatePDF(d);
      ext      = 'pdf';
      mimeType = 'application/pdf';
    }

    const fileName = `offer-letter-${application.display_id}-${Date.now()}.${ext}`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, buffer);

    await application.update({
      offer_letter_path: `/uploads/offer-letters/${fileName}`,
    });

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);
    return res.send(buffer);

  } catch (err) {
    console.error('generateOfferLetter error:', err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  listPositions,
  findOrCreatePosition,
  listAddresses,
  findOrCreateAddress,
  generateOfferLetter,
};