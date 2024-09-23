const mentalStatusExamination = (content) => {
  
  return `
  <!DOCTYPE html>
<html
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  lang="en"
>
  <head>
    <title></title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Mada:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <style>
      *,
      *::before,
      *::after {
        margin: 0;
        padding: 0;
        box-sizing: inherit;
      }

      html {
        box-sizing: border-box;
      }

      body {
        font-family: "Mada", sans-serif;
        font-size: 16px;
      }

      a[x-apple-data-detectors] {
        color: inherit !important;
        text-decoration: inherit !important;
      }

      .email {
        background-color: #ffffff;
        -webkit-text-size-adjust: none;
        text-size-adjust: none;
        padding: 20px 0;
      }

      .email__container {
        background-color: #f9f9f9;
        margin: 0 auto;
        width: 550px;
        max-width: 95%;
        padding-bottom: 50px;
      }

      /* HEADER */
      header {
        padding: 30px 0 20px 0;
      }

      header img:not(:last-child) {
        margin-bottom: 30px;
      }

      header {
        margin: 0 50px;
        display: block;
      }

      .color {
        color: #7c7c7c;
      }
      .dark-color {
        color: #242424;
      }

      .email__p {
        max-width: 80%;
        margin: 0 auto;
        color: #7c7c7c;
        font-size: 14px;
        line-height: 152%;
        margin-bottom: 15px;
      }

      .email__cta {
        align-self: flex-start;
        text-decoration: none;
        font-weight: 500;
        font-size: 14px;
        line-height: 162%;
        letter-spacing: 1px;
        color: #ffffff;
        background: #f8b133;
        border-radius: 4px;
        padding: 6px 20px;
        margin-bottom: 30px;
        margin-top: 5px;
        display: inline-block;
      }

      .center_content {
        text-align: center;
      }

      .separator {
        max-width: 80%;
        margin: 10px auto;
        border-bottom: 1px solid #f0f0f0;
      }

      .table td {
        padding: 10px 30px;
        background-color: white;
      }

      .table__detail {
        font-weight: 500;
        color: black;
      }

      .table__paid {
        font-weight: 500;
        color: green;
        display: inline-block;
        padding: 4px 14px;
        margin-left: 10px;
        border-radius: 5px;
        background-color: rgb(214, 255, 214);
      }

      footer {
        margin-top: 20px;
      }

      .footer__socials {
        max-width: 80%;
        margin: 0 auto;
        display: flex;
      }

      .footer__social {
        display: inline-block;
        margin-right: 10px;
      }

      @media only screen and (max-width: 480px) {
        .email__p {
          max-width: 90%;
        }

        .email__misc {
          max-width: 90%;
        }

        .table td {
          padding: 15px 15px;
        }

        .table__email {
          font-size: 12px;
        }
      }
      .email__header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
      .bold {
        font-weight: bold;
        font-size: larger;
      }
    </style>
  </head>

  <body class="email">
    <div class="email__container">
      <header class="email__header">
        <img
          src="https://iili.io/hgTI5v.png"
          alt="PRIXLED"
          class="email__logo"
          height="55.5"
          width="160"
          title="Logo"
        />
        <p class="color">Lab Report</p>
      </header>
      <main>
        <div class="email__p">
          <div class="dark-color bold">Consciousness:</div>
          The level of consciousness of the patient was {{levelOfConsciousness}}.
        </div>


        <div class="email__p">
          <div class="dark-color bold">General Appearance and Behaviour</div>
          The patient exhibited a/an {{generalPhysicalAppearance}} general physical appearance, with a/an
          {{bodyBuild}} build that was {{estimateOfAge}}. They were dressed
          {{dress}} and were {{touchWithSurroundings}}. Eye contact was
          {{eyeContact}}, the patient displayed facial
          expressions that were indicative of {{facialExpression}}.
        </div>
        <div class="email__p">
          <span class="dark-color">Attitude:</span>
          <span
            >The patient's Attitude towards examiner was {{attitudeTowardsExaminer}}. The patient {{modeOfEntry}}, and their
            manner of relating appeared {{mannerOfRelating}}.</span
          >
          <br />
          <br />

          <div>
            <span class="dark-color">Motor Behaviour</span>:The patient
            exhibited {{psychomotorActivity}} psychomotor activity.
          </div>
          <br />

          <div class="dark-color bold">Perception</div>
          <br />
          <div>
            There was presence of {{visualHallucination}}
            hallucinations. 
          </div>

          <span class="dark-color">Sensory distortion</span>: The patient displayed features of
          {{changesInQuality}} in terms of changes in quality and {{changesInSpatialForm}} in terms of
          changes in spatial form.
          <br />
          <br />
          <div class="dark-color bold">Higher Functioning</div>
          <br />
          <span class="dark-color">Memory</span>: There were impairments in
          {{memory}} memory. <br />
          <span class="dark-color">Attention and Concentration</span>: Attention
          was {{attention}} and concentration was {{concentration}}. <br />
          <span class="dark-color">Orientation</span>: The patient was oriented
          to {{time}}, {{place}} and {{person}}. 
          <br />

          <span class="dark-color">Language</span>: The patient was adequate in
          terms of articulation, phonatation, comprehension and naming. The
          patient represented inadequacy in fluency and reading. There was no
          repetition of words throughout the session. 
          <br />

          <span class="dark-color">Judgement</span>: The social judgement of the
          patient is {{socialJudgment}}. <br />
          <br />
          <span class="dark-color bold">Thought</span><br />
          <br />
          <span class="dark-color">Stream</span>: There was a {{typeOfStream}}
          stream of thoughts.<br />
          <span class="dark-color">Form</span>: The form of thoughts exhibited {{form}}.<br />
          <span class="dark-color">Possession</span>: Reported Obsessions were {{obsession}}. However, rumination was {{rumination}} in nature. Observed thought patterns were {{thoughtPhenomenon}} 
           <br />
          <span class="dark-color"></span>: The patient experienced
          depressive cognitions characterized by {{depressiveCognitions}}. Additionally, there were anxious
          thoughts related to {{anxiousCognitions}}. The patient also expressed {{somaticPreoccupation}} There were no reported preoccupations with physical
          symptoms, stressors, or existential concerns. In terms of self-harm
          cognitions, the patient expressed thoughts of {{selfHarmCognitions}}. Manic-related cognitions observed during the session were {{mania}}.
          Furthermore, Other indications of possible delusions reported were {{possibleDelusions}}
          <br />
          <br />
          <span class="dark-color bold">Mood and Affect</span><br />
          The patient experiences {{quality}} affect, characterised by a {{intensity}}
          intensity. Their emotional state appears {{mobility}} and their range of
          emotions is {{range}}. However, communicability was {{communicability}}, and their emotional responses are {{appropriateness}} and
          {{congruence}}.<br />
          <br />
          <span class="dark-color bold">Other Phenomenon</span>
          {{paramesia}} detected
        </div>
      </main>
      <div class="separator"></div>
      <footer>
        <div class="footer__socials">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center">
                <div class="footer__social">
                  <a href="https://www.instagram.com/psymatehealthcare/">
                    <img
                      src="https://iili.io/hgTDpR.md.png"
                      alt="instagram"
                      width="24"
                      title="instagram"
                    />
                  </a>
                </div>
                <div class="footer__social">
                  <a href="https://twitter.com/psymatehealthcr">
                    <img
                      src="https://iili.io/hgufp4.md.png"
                      alt="twitter"
                      width="24"
                      title="twitter"
                    />
                  </a>
                </div>
                <div class="footer__social">
                  <a
                    href="https://www.linkedin.com/in/psymate-healthcare-851377202/"
                  >
                    <img
                      src="https://iili.io/hgTZYJ.md.png"
                      alt="linkedin"
                      width="24"
                      title="linkedin"
                    />
                  </a>
                </div>
                <div class="footer__social">
                  <a href="https://www.facebook.com/psymatehealthcr/">
                    <img
                      src="https://iili.io/hgTtkv.md.png"
                      alt="facebook"
                      width="24"
                      title="facebook"
                    />
                  </a>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </footer>
    </div>
  </body>
</html>
`;
};

module.exports = { mentalStatusExamination };
