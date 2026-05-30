export const SIGNUP_COPY = {
  brandName: "heartspirit",
  headline: "Create Account",
  subheadline: "Start today",
  fields: {
    fullName: "Full Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
  },
  termsPrefix: "I agree to the ",
  termsLink: "Terms of Use",
  termsAnd: " and ",
  privacyLink: "Privacy Policy",
  cta: "Create Account",
  ctaLoading: "Creating...",
  loginPrompt: "Already have an account?",
  loginLink: "Sign in",
  confirmationTitle: "",
  confirmationBody: "Check your email to activate your access.",
  confirmationSentTo: "Sent to",
  confirmationCta: "Go to Login",
  confirmationHint: "If you don't see it, check spam/promotions folder.",
  errors: {
    passwordsDontMatch: "Passwords don't match",
    mustAgreeToTerms: "You must agree to the Terms and Privacy Policy",
  },
  passwordHints: {
    minLength: "8+ characters",
    uppercase: "Uppercase",
  },
} as const

export const LOGIN_COPY = {
  headline: "Enter Your Portal",
  subtitle: "Rituals • Energy • Circles",
  cta: "Sign In",
  ctaLoading: "Signing in…",
  signupPrompt: "Don't have an account?",
  signupLink: "Create account",
  forgotPasswordLink: "Forgot password?",
  unconfirmedNotice: "Your portal isn't activated yet. Confirm your email, then sign in.",
  spamHint: "If you don't see the message, check spam/promotions.",
} as const

export const FORGOT_PASSWORD_COPY = {
  headline: "Reset Password",
  body: "Enter your email and we'll send you a link to reset your password.",
  cta: "Send Reset Link",
  ctaLoading: "Sending...",
  confirmationBody: "Check your email for a password reset link.",
  confirmationSentTo: "Sent to",
  confirmationCta: "Back to Login",
  confirmationHint: "If you don't see it, check spam/promotions folder.",
  backToLogin: "Back to Login",
} as const

export const RESET_PASSWORD_COPY = {
  headline: "Choose New Password",
  body: "Enter and confirm your new password.",
  cta: "Update Password",
  ctaLoading: "Updating...",
  successCta: "Continue",
} as const

const SITE_URL = "https://heartspirit.app"
export const TERMS_URL = SITE_URL + "/terms"
export const PRIVACY_URL = SITE_URL + "/privacy"