import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import { teacherPostSchema } from '../../../../../lib/zodSchemas/teacherPostSchema';
import { createTeacherPost, updateTeacherPost, resetError } from '../../../../redux/teacherPostSlice';

import Step1_EducationSystem from './Step1_EducationSystem';
import Step2_BoardGroup from './Step2_BoardGroup';
import Step3_LevelSubLevel from './Step3_LevelSubLevel';
import Step4_SubjectsTags from './Step4_SubjectsTags';
import Step5_PostDetails from './Step5_PostDetails';
import Step6_Extras from './Step6_Extras';
import Step7_Confirm from './Step7_Confirm';

import FullScreenWizard from './FormLayouts/fullScreenWizard';
// REMOVE the old ProgressBar import
// import ProgressBar from '../formComponents/FormLayouts/progressBar';
import HelperBlock from '../formComponents/FormLayouts/helperCard';
import StepTitle from '../formComponents/FormLayouts/stepTitle';
import StepActions from '../formComponents/FormLayouts/stepActions';
import ProgressSteps from '../formComponents/FormLayouts/progressSteps';

import { t } from '../../../../../lib/i18n/ui';

const steps = [
  { label: 'Education System', component: Step1_EducationSystem },
  { label: 'Board / Group', component: Step2_BoardGroup },
  { label: 'Level / Sublevel', component: Step3_LevelSubLevel },
  { label: 'Subjects / Universities', component: Step4_SubjectsTags },
  { label: 'Post Details', component: Step5_PostDetails },
  { label: 'Additional Info (Optional)', component: Step6_Extras },
  { label: 'Review & Submit', component: Step7_Confirm },
];

export default function CreatePostWizard({ initialData = null, onPostCreated, onPostUpdated, lang = 'en' }) {
  const [step, setStep] = useState(0);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.teacherPosts);

  const [educationTree, setEducationTree] = useState(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [treeError, setTreeError] = useState(null);

  useEffect(() => {
    async function fetchTree() {
      try {
        const res = await axios.get('http://localhost:5000/api/education-tree');
        setEducationTree(res.data);
      } catch {
        setTreeError('Failed to load education data.');
      } finally {
        setLoadingTree(false);
      }
    }
    fetchTree();
  }, []);

  const defaultValues = initialData ? {
    title: initialData.title || '',
    description: initialData.description || '',
    educationSystem: initialData.educationSystem || '',
    board: initialData.board || '',
    level: initialData.level || '',
    subLevel: initialData.subLevel || '',
    group: initialData.group || '',
    subjects: initialData.subjects || [],
    tags: initialData.tags || [],
    location: initialData.location || '',
    language: initialData.language || '',
    hourlyRate: initialData.hourlyRate || '',
    youtubeLink: initialData.youtubeLink || '',
    videoFile: null,
  } : {
    title: '',
    description: '',
    educationSystem: '',
    board: '',
    level: '',
    subLevel: '',
    group: '',
    subjects: [],
    tags: [],
    location: '',
    language: '',
    hourlyRate: '',
    youtubeLink: '',
    videoFile: null,
  };

  const methods = useForm({
    resolver: zodResolver(teacherPostSchema),
    mode: 'onChange',
    defaultValues,
  });

  useEffect(() => {
    if (error) dispatch(resetError());
  }, [step, dispatch, error]);

  if (loadingTree) return <p className="p-8">Loading education data...</p>;
  if (treeError) return <p className="p-8 text-red-600">{treeError}</p>;

  const onSubmit = async (data) => {
    let resultAction;
    if (initialData && initialData._id) {
      resultAction = await dispatch(updateTeacherPost({ id: initialData._id, data }));
    } else {
      resultAction = await dispatch(createTeacherPost(data));
    }
    if (resultAction.meta.requestStatus === 'fulfilled') {
      alert(initialData ? 'Post updated successfully!' : 'Post created successfully!');
      methods.reset();
      setStep(0);
      if (initialData && onPostUpdated) onPostUpdated(resultAction.payload);
      if (!initialData && onPostCreated) onPostCreated(resultAction.payload);
    }
  };

  const CurrentStep = steps[step].component;

  const handleNext = async () => {
    let fieldsToValidate = [];
    switch (step) {
      case 0: fieldsToValidate = ['educationSystem']; break;
      case 1: {
        const eduSys = methods.getValues('educationSystem');
        if (eduSys === 'Bangla-Medium' || eduSys === 'BCS') fieldsToValidate = ['group'];
        else if (eduSys === 'GED') fieldsToValidate = [];
        else fieldsToValidate = ['board'];
        break;
      }
      case 2: {
        fieldsToValidate = ['level'];
        const eduSys = methods.getValues('educationSystem');
        const board = methods.getValues('board');
        const level = methods.getValues('level');
        if (eduSys === 'English-Medium' && (board === 'CIE' || board === 'Edexcel') && level === 'A_Level') {
          fieldsToValidate.push('subLevel');
        }
        break;
      }
      case 3: fieldsToValidate = ['subjects']; break;
      case 4: fieldsToValidate = ['title', 'description', 'hourlyRate']; break;
      default: fieldsToValidate = [];
    }
    const valid = await methods.trigger(fieldsToValidate);
    if (valid) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));
  const editMode = Boolean(initialData && initialData._id);
  const isLast = step === steps.length - 1;

  const leftPanel = (
    <div className="space-y-6">
      <HelperBlock title={editMode ? t(lang,'edit') : t(lang,'goodToKnow')} icon={editMode ? '✏️' : '😊'}>
        {step < steps.length - 1 ? (
          <>
            <p className="mb-2">
              {t(lang,'stepXofY', { x: step + 1, y: steps.length })} — <span className="font-medium">{steps[step].label}</span>
            </p>
            {/* <p>{t(lang,'verify')}</p> */}
          </>
        ) : (
          <p>{t(lang,'almost')}</p>
        )}
      </HelperBlock>
    </div>
  );

  const rightPanel = (
    <div className="relative">
      {/* NEW: stepper replaces the old linear bar */}
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
            prefix={editMode ? t(lang,'updateYour') : t(lang,'createYour')}
            highlight={step === steps.length - 1 ? t(lang,'reviewing') : steps[step].label}
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
