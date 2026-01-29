import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";

import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  finalTeacherPostSchema,
} from "../../../../hooks/zodSchemas/teacherPostSchema";
import { applyZodErrors } from "@/lib/zodToRHF";

import {
  createTeacherPost,
  updateTeacherPost,
  resetError,
} from "../../../../redux/teacherPostSlice";

import API from "../../../../../api/axios";

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
  { label: "Education System", component: Step1_EducationSystem },
  { label: "Board / Group", component: Step2_BoardGroup },
  { label: "Level / Sublevel", component: Step3_LevelSubLevel },
  { label: "Subjects / Universities", component: Step4_SubjectsTags },
  { label: "Post Details", component: Step5_PostDetails },
  { label: "Additional Info", component: Step6_Extras },
  { label: "Review & Submit", component: Step7_Confirm },
];

const stepSchemas = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, step6Schema];

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
    // store a single File (or null) in RHF
    videoFile: null,
  };

  const methods = useForm({
    mode: "onBlur",
    defaultValues,
    // 🔑 keep values when a step unmounts
    shouldUnregister: false,
  });
  useEffect(() => {
    methods.register("videoFile");
  }, [methods]);
  useEffect(() => {
    if (error) dispatch(resetError());
  }, [step, dispatch, error]);

  if (loadingTree) return <p className="p-8">Loading education data...</p>;
  if (treeError) return <p className="p-8 text-red-600">{treeError}</p>;

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

  function computeNextIndex(curr, data) {
    const es = data.educationSystem;
    const board = data.board;

    if (curr === 0) return es === "GED" ? 3 : 1;
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

    if (es !== "Bangla-Medium") methods.setValue("group", "");
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

    const hasFile =
      payload.videoFile &&
      typeof payload.videoFile === "object" &&
      typeof payload.videoFile.name === "string" &&
      payload.videoFile.size > 0;

    try {
      let resultData;

      if (hasFile) {
        const fd = new FormData();
        fd.append("title", payload.title ?? "");
        fd.append("description", payload.description ?? "");
        fd.append("location", payload.location ?? "");
        fd.append("language", payload.language ?? "");
        fd.append("hourlyRate", String(payload.hourlyRate ?? ""));
        fd.append("youtubeLink", payload.youtubeLink ?? "");

        fd.append("educationSystem", payload.educationSystem ?? "");
        fd.append("board", payload.board ?? "");
        fd.append("level", payload.level ?? "");
        fd.append("subLevel", payload.subLevel ?? "");
        fd.append("group", payload.group ?? "");

        (payload.subjects ?? []).forEach((s) => fd.append("subjects", s));
        (payload.tags ?? []).forEach((t) => fd.append("tags", t));

        fd.append("videoFile", payload.videoFile);

        if (editMode) {
          const res = await API.put(`/posts/${initialData._id}`, fd, { withCredentials: true });
          resultData = res.data;
        } else {
          const res = await API.post("/posts", fd, { withCredentials: true });
          resultData = res.data;
        }
      } else {
        let resultAction;
        if (editMode) {
          resultAction = await dispatch(updateTeacherPost({ id: initialData._id, data: payload }));
        } else {
          resultAction = await dispatch(createTeacherPost(payload));
        }

        if (resultAction.meta?.requestStatus !== "fulfilled") {
          const msg =
            resultAction?.payload?.message ||
            resultAction?.error?.message ||
            "Server error";
          methods.setError("root", { type: "server", message: msg });
          return;
        }
        resultData = resultAction.payload;
      }

      alert(editMode ? "Post updated successfully!" : "Post created successfully!");
      methods.reset();
      setStep(0);
      if (editMode && onPostUpdated) onPostUpdated(resultData);
      if (!editMode && onPostCreated) onPostCreated(resultData);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || "Server error";
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
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-6 md:px-10 pt-4">
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
            highlight={step === steps.length - 1 ? t(lang, "reviewing") : steps[step].label}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
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
