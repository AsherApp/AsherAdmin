import {
  forwardRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
} from 'react';
import {
  prepareUploadFile,
  prepareUploadFiles,
  UploadFileTooLargeError,
} from '../../lib/clientUpload/prepareUploadFile';

type Props = {
  id?: string;
  name?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  hidden?: boolean;
  style?: CSSProperties;
  capture?: InputHTMLAttributes<HTMLInputElement>['capture'];
  onFile?: (file: File | null) => void;
  onFiles?: (files: File[]) => void;
  onError?: (message: string) => void;
  onCompressingChange?: (compressing: boolean) => void;
};

/** File input that compresses images on the device before the form sees them. */
export const CompressedFileInput = forwardRef<HTMLInputElement, Props>(
  function CompressedFileInput(
    {
      id,
      name,
      accept,
      multiple = false,
      disabled,
      className,
      hidden,
      style,
      capture,
      onFile,
      onFiles,
      onError,
      onCompressingChange,
    },
    ref
  ) {
    const [compressing, setCompressing] = useState(false);

    const setBusy = (busy: boolean) => {
      setCompressing(busy);
      onCompressingChange?.(busy);
    };

    return (
      <input
        ref={ref}
        id={id}
        name={name}
        type='file'
        accept={accept}
        multiple={multiple}
        disabled={disabled || compressing}
        className={className}
        hidden={hidden}
        style={style}
        capture={capture}
        onChange={async event => {
          const list = Array.from(event.target.files ?? []);
          event.target.value = '';
          if (list.length === 0) {
            onFile?.(null);
            onFiles?.([]);
            return;
          }
          setBusy(true);
          try {
            const prepared = multiple
              ? await prepareUploadFiles(list)
              : [await prepareUploadFile(list[0])];
            onFiles?.(prepared);
            onFile?.(prepared[0] ?? null);
          } catch (error) {
            const message =
              error instanceof UploadFileTooLargeError
                ? error.message
                : 'Could not prepare that file. Try another image or PDF under 20 MB.';
            onError?.(message);
            onFile?.(null);
            onFiles?.([]);
          } finally {
            setBusy(false);
          }
        }}
      />
    );
  }
);
