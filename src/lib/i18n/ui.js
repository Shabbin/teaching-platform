const dict = {
  en: {
    hello: "Hello, Teacher",
    edit: "Edit Your Post",
    stepXofY: "Step {x} of {y}",
    almost: "Almost done! Review your information.",
    createYour: "Create your",
    updateYour: "Update your",
    reviewing: "Review & Submit",
    goodToKnow: "Good to know",
    // verify: "Backend will verify after submission.",
  },
  bn: {
    hello: "হ্যালো, টিচার",
    edit: "আপনার পোস্ট সম্পাদনা করুন",
    stepXofY: "ধাপ {x} / {y}",
    almost: "প্রায় শেষ! তথ্যগুলো দেখে নিন।",
    createYour: "তৈরি করুন",
    updateYour: "আপডেট করুন",
    reviewing: "পর্যালোচনা ও সাবমিট",
    goodToKnow: "জানার জন্য ভালো",
    verify: "সাবমিটের পরে ব্যাকএন্ড যাচাই করবে।",
  },
};

export function t(lang, key, vars = {}) {
  let s = (dict[lang] && dict[lang][key]) || dict.en[key] || key;
  Object.entries(vars).forEach(([k, v]) => {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  });
  return s;
}
