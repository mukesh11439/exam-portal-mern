export default function QuestionPalette({ questions, answers, currentIndex, onSelect }) {
  return (
    <section className="surface p-5">
      <h2 className="mb-1 font-semibold text-ink dark:text-white">Question palette</h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Green indicates answered</p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {questions.map((question, index) => {
          const answered = answers[question._id] !== undefined;
          return (
            <button
              key={question._id}
              onClick={() => onSelect(index)}
              className={`h-9 rounded-lg border text-sm font-semibold transition ${
                index === currentIndex
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : answered
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Answered</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Unanswered</span>
      </div>
    </section>
  );
}

