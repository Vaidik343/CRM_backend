const { application } = require("express");
const {
    OfferLetterPosition,
    OfferLetterAddress,
    EmployeeApplication,
} = require("../models");
const { Op } = require("sequelize");

// positions

const listPositions = async () => {
    try {
        const search = req.query.search?.trim();

        const conditions = [];

        if (search) {
            conditions.push({
                [Op.or]: [{ name: { [Op.iLike]: `${search}` } }],
            });
        }
        const where = { [Op.and]: conditions };
        //create searchable
        const position = await OfferLetterPosition.findAll({
            order: [["name", "ASC"]],
        });

        return res.status(200).json({ position });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const findOrCreatePosition = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name?.trim())
            return res.status(400).json({ message: "Field Required" });

        const [position, created] = await OfferLetterPosition.findOrCreate({
            where: { name: name.trim() },
            default: { name: name.trim() },
        });

        return res.status(created ? 201 : 200).json({ position, created });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// address

const listAddresses = async (req, res) => {
    try {
        const addresses = await OfferLetterAddress.findAll({ order: [["name"]] });

        return res.status(200).json({ addresses });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const findOrCreateAddress = async () => {
    try {
        const { name } = req.body;
        if (!name?.trim())
            return res.status(400).json({ message: "Address is required" });

        const [address, created] = await OfferLetterAddress.findOrCreate({
            where: { name: name.trim() },
            default: { name: name.trim() },
        });

        return res.status(created ? 201 : 200).json({ address, created });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// generate offer letter

const generateOfferLetter = async (req, res) => {
    try {
        const { application_id } = rqe.params;

        const { position,
             office_address,
              start_date,
               employment_type,   // 'full time, half , part'
               salary,
            
            } = req.body;

if(!position || !office_address || !start_date || !employment_type || !salary)
{
    return res.status(400).json({message: 'All fields are required.'});
}


// derived values

const salaryFormatted = `${Number(salary).toLocaleString('en-IN')}.00}`;
const salaryFormula = `[(${salaryFormatted} INT/30) X Total no. of leaves for that month.]`
const gender = application.gender;
const salutation = gender === 'female' ? 'Ms.' : 'Mr.';
const pronoun = gender === 'female' ? 'she' : 'he';
const fullName = `${application.first_name} ${application.last_name}`;

const employmentLabel = {
    fulltime: 'Full Time',
    halftime: 'Half Time',
    work_form_home: 'Work From Home',
}[employment_type] || employment_type;

const today = new Date().toLocaleDateString('en-In', {
    day: '2-digit', month: 'long', year: 'numeric',
});

const startDateFmt = new Date(start_date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
});

// helper builders

  const bold = (text, size = 22) => new TextRun({ text, bold: true, size });

    const normal = (text, size = 22) => new TextRun({ text, size });

    const para = (
      children,
      alignment = AlignmentType.LEFT,
      spacing = { after: 120 },
    ) => new Paragraph({ children, alignment, spacing });

    const heading = (text) =>
      new Paragraph({
        children: [bold(text, 24)],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      });

    const bullet = (children) =>
      new Paragraph({
        children,
        bullet: { level: 0 },
        spacing: { after: 80 },
      });

    // ── document ──
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Calibri", size: 22 },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1.25),
                right: convertInchesToTwip(1.25),
              },
            },
          },
          children: [
            // Date — right aligned
            para([bold(`Date: ${today}`)], AlignmentType.RIGHT),

            para([normal("")], AlignmentType.LEFT, { after: 60 }),

            // Private and Confidential
            para([bold("Private and Confidential")]),

            // Name + Address + Mobile
            para([bold(`Name: ${fullName}`)]),
            para([bold(`Add : ${application.address}`)]),
            para([bold(`Mob: ${application.phone}`)]),

            para([normal("")], AlignmentType.LEFT, { after: 60 }),

            // OFFER LETTER heading
            para([bold("OFFER LETTER", 26)], AlignmentType.CENTER),

            para([bold("Dear,")]),
            para([bold(`${salutation} ${fullName}`)]),

            para([normal("")], AlignmentType.LEFT, { after: 60 }),

            // Opening paragraph
            para([
              normal(
                "I am pleased to offer you employment in the position of ",
              ),
              bold(position),
              normal(" with us at"),
            ]),

            // Company + office address
            para([
              bold("Blue Bell Compuserve Pvt. Ltd."),
              normal(`  Add: ${office_address}`),
            ]),

            // ── Position section ──
            heading("Position"),

            bullet([normal(`Your start date will be `), bold(startDateFmt)]),
            bullet([
              normal(`Your employment will be `),
              bold(employmentLabel),
              normal("."),
            ]),
            bullet([
              normal(
                "You will be required to perform these duties, and any other duties the employer may assign to you, having regard to your skills, training and experience.",
              ),
            ]),
            bullet([
              normal(
                "You will be required to perform your duties at our organization or elsewhere as reasonably directed by the employer.",
              ),
            ]),
            bullet([
              normal(
                "You need to perform your duty as per company's rules and Regulation.",
              ),
            ]),

            // ── Probation ──
            heading("Probation"),

            bullet([
              normal(
                "A probation period will apply for the first six months of your employment. During the period we will assess your progress and performance in the position.",
              ),
            ]),
            bullet([
              normal(
                "The additional terms and conditions set out by the company will also apply to your employment.",
              ),
            ]),

            // ── Ordinary hours ──
            heading("Ordinary hours of work"),

            bullet([
              normal("Your ordinary hours of work will be "),
              bold("six days per week for eight and half hours"),
              normal(
                ", plus any reasonable additional hours that are necessary to fulfill your duties or as otherwise required by the employer.",
              ),
            ]),

            // ── Remuneration ──
            heading("Remuneration"),

            bullet([
              normal(`You will be paid `),
              bold(`${salaryFormatted} INR`),
              normal(" per month."),
            ]),
            bullet([
              normal(
                "Your remuneration will be reviewed annually and may be increased at the employer's discretion.",
              ),
            ]),

            // ── Leave ──
            heading("Leave"),

            bullet([
              normal(
                "No leave will be allowed during First six Months' Probation Period, leave taken during this period will be counted as Leave Without Pay.",
              ),
            ]),
            bullet([
              normal(
                "You are allowed to get 2 paid leaves per month including sick leave after probation period.",
              ),
            ]),
            bullet([
              normal(
                "Once you use all paid your leave, pay for any additional leave will be deductible from your monthly pay. (Formula for deduction of pay for additional leaves is ",
              ),
              bold(salaryFormula),
              normal(")"),
            ]),

            // ── Obligations ──
            heading("Your obligations to the employer"),

            bullet([
              normal(
                "Perform all duties to the best of your ability at all times;",
              ),
            ]),
            bullet([
              normal(
                "Use your best endeavors to promote and protect the interests of the employer; and",
              ),
            ]),
            bullet([
              normal("In case of resignation, you are required to provide a "),
              bold("two-month prior notice"),
              normal(
                ". Failure to do so will result in a deduction of salary equivalent to the notice period shortfall.",
              ),
            ]),
            bullet([
              normal(
                "One-year bond period will be start after six-month probation period.",
              ),
            ]),
            bullet([
              normal(
                "Your employer will also provide you one-month prior notice before termination of your employment contract.",
              ),
            ]),
            bullet([
              normal(
                "If you wish to terminate your employment you are not allowed to work with our client or in the same industries unless there is no obligation from your employer.",
              ),
            ]),

            // ── Confidentiality ──
            heading("Confidentiality"),

            bullet([
              normal(
                "By accepting this letter of offer, you acknowledge and agree that you will not, during the course of your employment or thereafter, except with the consent of the employer, as required by law or in the performance of your duties, use or disclose confidential information relating to the business of the employer, including but not limited to client lists, trade secrets, client details and pricing structures.",
              ),
            ]),

            // ── Entire agreement ──
            heading("Entire agreement"),

            bullet([
              normal(
                "The terms and conditions referred to in this letter constitute all of the terms and conditions of your employment and replace any prior understanding or agreement between you and the employer.",
              ),
            ]),
            bullet([
              normal(
                "The terms and conditions referred to in this letter may only be varied by a written agreement",
              ),
            ]),

            para(
              [normal("Signed by both you and the employer.")],
              AlignmentType.LEFT,
              { before: 60, after: 400 },
            ),

            // Contact line
            para([
              bold(
                "If you have any questions about the terms and conditions of employment, please do not hesitate to contact Mayur Patel - 9727117623.",
              ),
            ]),

            para([normal("")], AlignmentType.LEFT, { after: 400 }),

            // Sign-off
            para([bold("Yours sincerely,")]),
            para([bold("Mayur Patel.")]),
            para([normal("For, Blue Bell Compuserve Pvt. Ltd.")]),

            para([normal("")], AlignmentType.LEFT, { after: 400 }),

            // Acceptance line
            para([
              normal(
                "I have read and understood this letter and accept the offer of employment from Blue Bell Compuserve Pvt. Ltd. on the terms and conditions set out in the letter.",
              ),
            ]),

            para([normal("")], AlignmentType.LEFT, { after: 240 }),

            para([
              normal(
                "Signed: ____________________          Date: ____________________",
              ),
            ]),
          ],
        },
      ],
    });

    // ── save to disk ──
    const outputDir = path.join(
      process.env.UPLOAD_PATH || path.join(__dirname, "..", "uploads"),
      "offer-letters",
    );
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `offer-letter-${application.display_id}-${Date.now()}.docx`;
    const filePath = path.join(outputDir, fileName);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);

    // ── save path to application record ──
    await application.update({
      offer_letter_path: `/uploads/offer-letters/${fileName}`,
    });

    // ── stream file to client ──
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    return res.send(buffer);


    } catch (error) { 

         console.error("generateOfferLetter error:", error);
    return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    listPositions,
    findOrCreatePosition,
    listAddresses,
    findOrCreateAddress,
    generateOfferLetter,
}