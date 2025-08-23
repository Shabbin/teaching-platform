import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";

import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,      // Subjects / Tags
  step5Schema,      // Post Details
  step6Schema,      // Extras with required location/language + XOR youtube/video
  finalTeacherPostSchema,
} from "../../../../hooks/zodSchemas/teacherPostSchema";
import { applyZodErrors } from "@/lib/zodToRHF";

import {
  createTeacherPost,
  updateTeacherPost,
  resetError,
} from "../../../../redux/teacherPostSlice";

// ✅ use env-driven axios wrapper instead of raw axios
import API from "../../../../api/axios";

import Step1_EducationSystem from "./Step1_EducationSystem";
import Step2_BoardGroup from "./Step2_BoardGroup";
import Step3_LevelSubLevel from "./Step3_LevelSubLevel";
import Step4_SubjectsTags from "./Step4_SubjectsTags";
import Step5_PostDetails from "./Step5_PostDetails";
import Step6_Extras from "./Step6_Extras";
import Step7_Confirm from "./Step7_Confirm";

import FullScreenWizard from "./FormLayouts/fullScreenWizard";
import HelperBlock from "../formComponents/FormLayouts/helperCard";
import StepTitle from "../formComponents/FormLayouts/stepTitle";
import StepActions from "../formComponents/FormLayouts/stepActions";
import ProgressSteps from "../formComponents/FormLayouts/progressSteps";

import { t } from "../../../../../lib/i18n/ui";

const steps = [
  { label: "Education System", component: Step1_EducationSystem },     // 0
  { label: "Board / Group", component: Step2_BoardGroup },             // 1
  { label: "Level / Sublevel", component: Step3_LevelSubLevel },       // 2
  { label: "Subjects / Universities", component: Step4_SubjectsTags }, // 3
  { label: "Post Details", component: Step5_PostDetails },             // 4
  { label: "Additional Info", component: Step6_Extras },               // 5
  { label: "Review & Submit", component: Step7_Confirm },              // 6
];

const stepSchemas = [
  step1Schema, // 0
  step2Schema, // 1
  step3Schema, // 2
  step4Schema, // 3
  step5Schema, // 4
  step6Schema, // 5
];

export default function CreatePostWizard({
  initialData = null,
  onPostCreated,
  onPostUpdated,
  lang = "en",
}) {
  const [step, setStep] = useState(0);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.teacherPosts);

  const [educationTree, setEducationTree] = useState(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [treeError, setTreeError] = useState(null);

  useEffect(() => {
    async function fetchTree() {
      try {
        // ✅ now uses API client (baseURL/env aware)
        const res = await API.get("/education-tree");
        setEducationTree(res.data);
      } catch {
        setTreeError("Failed to load education data.");
      } finally {
        setLoadingTree(false);
      }
    }
    fetchTree();
  }, []);

  const defaultValues = {
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    educationSystem: initialData?.educationSystem ?? "",
    board: initialData?.board ?? "",
    level: initialData?.level ?? "",
    subLevel: initialData?.subLevel ?? "",
    group: initialData?.group ?? "",
    subjects: initialData?.subjects ?? [],
    tags: initialData?.tags ?? [],
    location: initialData?.location ?? "",
    language: initialData?.language ?? "",
    hourlyRate: initialData?.hourlyRate ?? "",
    youtubeLink: initialData?.youtubeLink ?? "",
    videoFile: (initialData && initialData.videoFile) || "",
  };

  const methods = useForm({
    mode: "onBlur",
    defaultValues,
  });

  useEffect(() => {
    if (error) dispatch(resetError());
  }, [step, dispatch, error]);

  if (loadingTree) return <p className="p-8">Loading education data...</p>;
  if (treeError) return <p className="p-8 text-red-600">{treeError}</p>;

  /** Validate only the currently visible step */
  async function validateCurrentStep() {
    const schema = stepSchemas[step];
    if (!schema) return true;
    const data = methods.getValues();
    const result = await schema.safeParseAsync(data);
    if (!result.success) {
      applyZodErrors(result.error, methods.setError);
      return false;
    }
    return true;
  }

  /** Compute where to go next, skipping non-applicable steps */
  function computeNextIndex(curr, data) {
    const es = data.educationSystem;
    const board = data.board;

    if (curr === 0) {
      if (es === "GED") return 3;
      return 1;
    }
    if (curr === 1) {
      if (es === "BCS") return 4;
      if (es === "GED") return 3;
      if (es === "Entrance-Exams") return 3;
      if (es === "University-Admission" && board !== "Public-University") return 3;
      return 2;
    }
    if (curr === 2) return 3;
    if (curr === 3) return 4;
    if (curr === 4) return 5;
    if (curr === 5) return 6;
    return Math.min(curr + 1, steps.length - 1);
  }

  /** Compute previous index respecting the same path rules */
  function computePrevIndex(curr, data) {
    const es = data.educationSystem;
    const board = data.board;

    if (curr === 3) {
      if (es === "GED") return 0;
      if (es === "Entrance-Exams") return 1;
      if (es === "University-Admission" && board !== "Public-University") return 1;
      return 2;
    }
    if (curr === 4) {
      if (es === "BCS") return 1;
      if (es === "GED") return 0;
      if (es === "Entrance-Exams") return 1;
      if (es === "University-Admission" && board !== "Public-University") return 1;
      return 3;
    }
    if (curr === 5) return 4;
    if (curr === 6) return 5;
    return Math.max(curr - 1, 0);
  }

  async function handleNext() {
    const data = methods.getValues();
    const es = data.educationSystem;

    if (es !== "Bangla-Medium") {
      methods.setValue("group", "");
    }
    if (es === "GED") {
      methods.setValue("board", "");
      methods.setValue("level", "");
      methods.setValue("subLevel", "");
    }
    if (es === "Entrance-Exams") {
      methods.setValue("level", "");
      methods.setValue("subLevel", "");
    }
    if (es === "University-Admission" && data.board !== "Public-University") {
      methods.setValue("level", "");
      methods.setValue("subLevel", "");
    }
    if (es === "BCS") {
      methods.setValue("group", "");
      methods.setValue("level", "");
      methods.setValue("subLevel", "");
      methods.setValue("tags", []);
      methods.setValue("subjects", []);
    }

    const ok = await validateCurrentStep();
    if (!ok) return;

    const next = computeNextIndex(step, methods.getValues());
    setStep(next);
  }

  function handleBack() {
    const prev = computePrevIndex(step, methods.getValues());
    setStep(prev);
  }

  const editMode = Boolean(initialData && initialData._id);
  const isLast = step === steps.length - 1;

  async function onSubmit(raw) {
    const parsed = await finalTeacherPostSchema.safeParseAsync(raw);
    if (!parsed.success) {
      applyZodErrors(parsed.error, methods.setError);
      return;
    }
    const payload = parsed.data;

    let resultAction;
    if (initialData && initialData._id) {
      resultAction = await dispatch(
        updateTeacherPost({ id: initialData._id, data: payload })
      );
    } else {
      resultAction = await dispatch(createTeacherPost(payload));
    }

    if (resultAction.meta?.requestStatus === "fulfilled") {
      alert(initialData ? "Post updated successfully!" : "Post created successfully!");
      methods.reset();
      setStep(0);
      if (initialData && onPostUpdated) onPostUpdated(resultAction.payload);
      if (!initialData && onPostCreated) onPostCreated(resultAction.payload);
    } else {
      const msg =
        resultAction?.payload?.message ||
        resultAction?.error?.message ||
        "Server error";
      methods.setError("root", { type: "server", message: msg });
    }
  }

  const CurrentStep = steps[step].component;

  const leftPanel = (
    <div className="space-y-6">
      <HelperBlock
        title={editMode ? t(lang, "edit") : t(lang, "goodToKnow")}
        icon={editMode ? "✏️" : "😊"}
      >
        {step < steps.length - 1 ? (
          <p className="mb-2">
            {t(lang, "stepXofY", { x: step + 1, y: steps.length })} —{" "}
            <span className="font-medium">{steps[step].label}</span>
          </p>
        ) : (
          <p>{t(lang, "almost")}</p>
        )}
      </HelperBlock>
    </div>
  );

  const rightPanel = (
    <div className="relative">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur px-6 md:px-10 pt-4">
        <ProgressSteps steps={steps} currentStep={step} />
      </div>

      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="px-6 md:px-10 py-8"
          encType="multipart/form-data"
        >
          <StepTitle
            prefix={editMode ? t(lang, "updateYour") : t(lang, "createYour")}
            highlight={
              step === steps.length - 1 ? t(lang, "reviewing") : steps[step].label
            }
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl shadow-sm border border-[color-mix(in_oklch,var(--brand)_10%,black)] p-6 md:p-8"
            >
              <CurrentStep
                onNext={handleNext}
                onBack={handleBack}
                isSubmitting={loading}
                loading={loading}
                error={error}
                resetError={() => dispatch(resetError())}
                educationTree={educationTree}
                onFinalSubmit={methods.handleSubmit(onSubmit)}
                editMode={editMode}
              />
            </motion.div>
          </AnimatePresence>

          <StepActions
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={methods.handleSubmit(onSubmit)}
            isLast={isLast}
            loading={loading}
            nextDisabled={false}
          />
        </form>
      </FormProvider>
    </div>
  );

  return <FullScreenWizard left={leftPanel} right={rightPanel} />;
}
