import '@aws-cdk/assert/jest';
import iam = require('@aws-cdk/aws-iam');
import cdk = require('@aws-cdk/core');
import { AwsCustomResource } from '../../lib';

// tslint:disable:object-literal-key-quotes

test('aws sdk js custom resource with onCreate and onDelete', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new AwsCustomResource(stack, 'AwsSdk', {
      onCreate: {
        service: 'CloudWatchLogs',
        action: 'putRetentionPolicy',
        parameters: {
          logGroupName: '/aws/lambda/loggroup',
          retentionInDays: 90
        },
        physicalResourceId: 'loggroup'
      },
      onDelete: {
        service: 'CloudWatchLogs',
        action: 'deleteRetentionPolicy',
        parameters: {
          logGroupName: '/aws/lambda/loggroup',
        }
      }
    });

    // THEN
    expect(stack).toHaveResource('Custom::AWS', {
      "Create": {
        "service": "CloudWatchLogs",
        "action": "putRetentionPolicy",
        "parameters": {
          "logGroupName": "/aws/lambda/loggroup",
          "retentionInDays": 90
        },
        "physicalResourceId": "loggroup"
      },
      "Delete": {
        "service": "CloudWatchLogs",
        "action": "deleteRetentionPolicy",
        "parameters": {
          "logGroupName": "/aws/lambda/loggroup"
        }
      }
    });

    expect(stack).toHaveResource('AWS::IAM::Policy', {
    "PolicyDocument": {
      "Statement": [
        {
          "Action": "logs:PutRetentionPolicy",
          "Effect": "Allow",
          "Resource": "*"
        },
        {
          "Action": "logs:DeleteRetentionPolicy",
          "Effect": "Allow",
          "Resource": "*"
        }
      ],
      "Version": "2012-10-17"
    },
  });
});

test('onCreate defaults to onUpdate', () => {
  // GIVEN
  const stack = new cdk.Stack();

  // WHEN
  new AwsCustomResource(stack, 'AwsSdk', {
    onUpdate: {
      service: 's3',
      action: 'putObject',
      parameters: {
        Bucket: 'my-bucket',
        Key: 'my-key',
        Body: 'my-body'
      },
      physicalResourceIdPath: 'ETag'
    },
  });

  // THEN
  expect(stack).toHaveResource('Custom::AWS', {
    "Create": {
      "service": "s3",
      "action": "putObject",
      "parameters": {
        "Bucket": "my-bucket",
        "Key": "my-key",
        "Body": "my-body"
      },
      "physicalResourceIdPath": "ETag"
    },
    "Update": {
      "service": "s3",
      "action": "putObject",
      "parameters": {
        "Bucket": "my-bucket",
        "Key": "my-key",
        "Body": "my-body"
      },
      "physicalResourceIdPath": "ETag"
    },
  });
});

test('with custom policyStatements', () => {
  // GIVEN
  const stack = new cdk.Stack();

  // WHEN
  new AwsCustomResource(stack, 'AwsSdk', {
    onUpdate: {
      service: 'S3',
      action: 'putObject',
      parameters: {
        Bucket: 'my-bucket',
        Key: 'my-key',
        Body: 'my-body'
      },
      physicalResourceIdPath: 'ETag'
    },
    policyStatements: [
      new iam.PolicyStatement({
        actions: ['s3:PutObject'],
        resources: ['arn:aws:s3:::my-bucket/my-key']
      })
    ]
  });

  // THEN
  expect(stack).toHaveResource('AWS::IAM::Policy', {
    "PolicyDocument": {
      "Statement": [
        {
          "Action": "s3:PutObject",
          "Effect": "Allow",
          "Resource": "arn:aws:s3:::my-bucket/my-key"
        },
      ],
      "Version": "2012-10-17"
    },
  });
});

test('fails when no calls are specified', () => {
  const stack = new cdk.Stack();
  expect(() => new AwsCustomResource(stack, 'AwsSdk', {})).toThrow(/`onCreate`.+`onUpdate`.+`onDelete`/);
});

test('fails when no physical resource method is specified', () => {
  const stack = new cdk.Stack();

  expect(() => new AwsCustomResource(stack, 'AwsSdk', {
    onUpdate: {
      service: 'CloudWatchLogs',
      action: 'putRetentionPolicy',
      parameters: {
        logGroupName: '/aws/lambda/loggroup',
        retentionInDays: 90
      }
    }
  })).toThrow(/`physicalResourceId`.+`physicalResourceIdPath`/);
});

test('encodes booleans', () => {
  // GIVEN
  const stack = new cdk.Stack();

  // WHEN
  new AwsCustomResource(stack, 'AwsSdk', {
    onCreate: {
      service: 'service',
      action: 'action',
      parameters: {
        trueBoolean: true,
        trueString: 'true',
        falseBoolean: false,
        falseString: 'false'
      },
      physicalResourceId: 'id'
    },
  });

  // THEN
  expect(stack).toHaveResource('Custom::AWS', {
    "Create": {
      "service": "service",
      "action": "action",
      "parameters": {
        "trueBoolean": "TRUE:BOOLEAN",
        "trueString": "true",
        "falseBoolean": "FALSE:BOOLEAN",
        "falseString": "false"
      },
      "physicalResourceId": "id"
    },
  });
});