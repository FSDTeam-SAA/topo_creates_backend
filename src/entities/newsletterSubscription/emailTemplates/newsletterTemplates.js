/**
 * Email templates for Newsletter Subscription
 */

export const adminNewSubscriberNotification = (email) => `
  <h2>New Newsletter Subscriber</h2>
  <p>A new user has subscribed to the newsletter.</p>
  <p><strong>Email:</strong> ${email}</p>
  <br/>
`;

export const subscriberWelcomeEmail = () => `
  <!DOCTYPE html>
  <html>
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Avenir:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      * {
        font-family: 'Avenir';
      }
      body {
        font-family: 'Avenir';
        background-color: #f9f9f9;
        margin: 0;
        padding: 20px;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 40px;
        text-align: center;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .logo {
        margin-bottom: 30px;
      }
      .logo svg {
        width: 70px;
        height: 60px;
      }
      h1 {
        font-size: 28px;
        color: #000;
        margin: 20px 0 15px 0;
        font-weight: 600;
        letter-spacing: 0.5px;
        font-family: 'Avenir';
      }
      .subtitle {
        font-size: 16px;
        color: #333;
        margin-bottom: 30px;
        line-height: 1.6;
        font-weight: 500;
        font-family: 'Avenir';
      }
      .content-section {
        margin: 40px 0;
        text-align: center;
      }
      .content-section p {
        font-size: 15px;
        color: #555;
        line-height: 1.8;
        margin: 10px 0;
        font-weight: 400;
        font-family: 'Avenir';
      }
      .divider {
        height: 1px;
        background-color: #e0e0e0;
        margin: 40px 0;
      }
      .footer {
        margin-top: 40px;
        padding-top: 30px;
        border-top: 1px solid #e0e0e0;
      }
      .footer-brand {
        font-size: 18px;
        font-weight: 700;
        color: #000;
        margin-bottom: 20px;
        letter-spacing: 1px;
        font-family: 'Avenir';
      }
      .footer-links {
        font-size: 13px;
        color: #666;
        margin-bottom: 20px;
        white-space: nowrap;
      }
      .footer-links a {
        color: #000;
        text-decoration: none;
        margin: 0 12px;
        font-weight: 400;
        font-family: 'Avenir';
      }
      .social-icons {
        margin: 20px 0;
      }
      .social-icons a {
        display: inline-block;
        color: #000;
        text-decoration: none;
      }
      .social-icons a:hover {
        opacity: 0.7;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="logo">
        <svg width="70" height="60" viewBox="0 0 70 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M69.9206 58.5336V58.7194C65.8696 60.1937 61.7299 60.2866 57.8605 59.5474C49.5811 57.8873 43.9123 53.0928 38.8728 42.4943C32.3929 28.6685 34.374 32.6308 26.8127 16.5915L25.2836 44.8894C25.1949 47.01 25.6426 48.0238 26.8127 48.0238V48.2096H23.0321V48.0238H23.1208C24.2909 48.0238 24.5612 45.8103 24.5612 44.8894L26.0904 15.206C22.0394 6.54219 17.4519 2.02231 11.6901 0.733927C8.00239 -0.0940146 4.49209 -0.00530383 0.0820312 1.38023V1.19437C4.13303 -0.186945 8.27274 -0.279877 12.1421 0.455132C18.4404 1.6548 23.0321 4.69622 26.9901 10.872H27.0788V10.9649C28.2489 12.8996 29.419 15.0201 30.5891 17.5082C33.8291 24.3303 37.1578 31.5198 40.5794 38.8024L51.4693 11.0579L51.558 10.872H56.4159V11.0579C55.3345 11.0579 54.4347 11.9787 54.4347 13.0855C54.4347 13.0855 55.6048 34.7471 56.1455 43.4109C56.3272 46.3594 57.3156 48.0195 58.2154 48.0195H58.3041V48.2054H51.1948V48.0195C52.2761 48.0195 53.4463 46.3594 53.3533 43.318L51.6425 12.7137V12.6208L40.9342 39.6303L43.0928 44.2389C47.0508 52.7211 52.4536 57.883 58.2999 59.1714C62.0002 60.0078 65.5105 59.9149 69.9206 58.5336Z" fill="black"/>
        </svg>
      </div>

      <h1>THANK YOU</h1>
      
      <div class="subtitle">
        You're now subscribed to the Muse Gala newsletter.
      </div>

      <div class="content-section">
        <p>Get ready to stay updated with the latest fashion trends, exclusive offers, and special collections.</p>
        <p>We'll keep you inspired with curated content delivered straight to your inbox.</p>
      </div>

      <div class="divider"></div>

      <div class="footer">
        <div class="footer-brand">MUSE GALA</div>
        
        <div class="footer-links">
          <a href="https://musegala.com.au/terms-and-conditions">TERMS</a> | <a href="https://musegala.com.au/privacy-policy">PRIVACY</a> | <a href="https://musegala.com.au/unsubscribe">UNSUBSCRIBE</a>
        </div>

        <div class="social-icons">
          <a href="https://www.instagram.com/musegala/" target="_blank" rel="noopener noreferrer" style="display: inline-block; text-decoration: none;">
            <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="24" height="24" style="display: block;" />
          </a>
        </div>
      </div>
    </div>
  </body>
  </html>
`;
