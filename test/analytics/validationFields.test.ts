// @vitest-environment node — 순수 함수만 본다.
import { describe, expect, it } from 'vitest';
import { defaultYieldFormValues, validateFormValues } from '@/shared/lib/snowball';

/**
 * 검증 결과가 **어느 필드가 틀렸는지**를 함께 낸다.
 *
 * ## 왜 (2026-08-22 GA4 실측)
 * `validation_error_view` 는 택소노미에 "이탈 유발 입력 항목 식별"이라고 적혀 있는데, 실제로는
 * `error_count` 만 보내고 있었다 — 45건 전부 `field_name=(not set)`. "몇 개 틀렸다"는 알지만
 * **"무엇이 틀렸다"는 몰랐다.** 원인은 `validateFormValues` 가 zod 의 `issue.path` 를 버린 것이었다.
 *
 * ⚠ `errors`(사람이 읽는 메시지)와 `fields`(계측용 필드명)는 **다른 값공간**이다. 메시지는 카피를
 *   고치면 바뀌지만 필드 이름은 안 바뀐다 — 계측에 메시지를 실으면 문구 수정마다 시계열이 끊긴다.
 */

describe('validateFormValues — fields', () => {
  it('통과하면 errors 도 fields 도 비어 있다', () => {
    const result = validateFormValues(defaultYieldFormValues);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.fields).toEqual([]);
  });

  it('🔴 실패하면 어느 필드인지 이름으로 알려 준다', () => {
    const result = validateFormValues({ ...defaultYieldFormValues, initialInvestment: -1 });

    expect(result.isValid).toBe(false);
    expect(result.fields.length).toBeGreaterThan(0);
    expect(result.fields).toContain('initialInvestment');
  });

  it('필드 이름은 중복되지 않는다 — 한 필드에 규칙이 둘 걸려도 한 번만 센다', () => {
    const result = validateFormValues({ ...defaultYieldFormValues, initialInvestment: -1 });

    expect(new Set(result.fields).size).toBe(result.fields.length);
  });

  it('여러 필드가 틀리면 전부 담는다', () => {
    const result = validateFormValues({
      ...defaultYieldFormValues,
      initialInvestment: -1,
      monthlyContribution: -1
    });

    expect(result.fields).toContain('initialInvestment');
    expect(result.fields).toContain('monthlyContribution');
  });

  it('메시지와 필드는 별개의 값공간이다 — 필드에 문장이 섞이지 않는다', () => {
    const result = validateFormValues({ ...defaultYieldFormValues, initialInvestment: -1 });

    // 필드 이름은 식별자다. 공백이 들어간 문장이 여기 오면 메시지를 잘못 실은 것이다.
    for (const field of result.fields) expect(field).not.toMatch(/\s/);
  });
});
