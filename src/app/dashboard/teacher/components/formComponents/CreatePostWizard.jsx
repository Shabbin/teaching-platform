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

const steps = [
  { label: 'Education System', component: Step1_EducationSystem },
  { label: 'Board / Group', component: Step2_BoardGroup },
  { label: 'Level / Sublevel', component: Step3_LevelSubLevel },
  { label: 'Subjects / Universities', component: Step4_SubjectsTags },
  { label: 'Post Details', component: Step5_PostDetails },
  { label: 'Additional Info (Optional)', component: Step6_Extras },
  { label: 'Review & Submit', component: Step7_Confirm },
];

export default function CreatePostWizard({ initialData = null, onPostCreated, onPostUpdated }) {
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
      } catch (err) {
        setTreeError('Failed to load education data.');
      } finally {
        setLoadingTree(false);
      }
    }
    fetchTree();
  }, []);

  const defaultValues = initialData
    ? {
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
        file: null,
      }
    : {
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
        file: null,
      };

  const methods = useForm({
    resolver: zodResolver(teacherPostSchema),
    mode: 'onChange',
    defaultValues,
  });

  useEffect(() => {
    if (error) dispatch(resetError());
  }, [step, dispatch, error]);

  if (loadingTree) return <p>Loading education data...</p>;
  if (treeError) return <p className="text-red-600">{treeError}</p>;

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
      case 0:
        fieldsToValidate = ['educationSystem'];
        break;
      case 1: {
        const eduSys = methods.getValues('educationSystem');
        if (eduSys === 'Bangla-Medium' || eduSys === 'BCS') {
          fieldsToValidate = ['group'];
        } else if (eduSys === 'GED') {
          fieldsToValidate = [];
        } else {
          fieldsToValidate = ['board'];
        }
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
      case 3:
        fieldsToValidate = ['subjects'];
        break;
      case 4:
        fieldsToValidate = ['title', 'description', 'hourlyRate'];
        break;
      default:
        fieldsToValidate = [];
    }

    const valid = await methods.trigger(fieldsToValidate);
    if (valid) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const editMode = Boolean(initialData && initialData._id);

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md col-span-1 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">
              {editMode ? 'Edit Your Post 👋' : 'Hello, Teacher 👋'}
            </h2>
            <p className="text-gray-600 text-lg">
              {step < steps.length - 1
                ? `Step ${step + 1} of ${steps.length}: ${steps[step].label}`
                : 'Almost done! Review your information.'}
            </p>
          </div>

          <div className="col-span-2">
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="bg-white p-6 rounded-xl shadow-md"
              encType="multipart/form-data"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.4 }}
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
            </form>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
