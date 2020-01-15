import '@aws-cdk/assert/jest';
import ec2 = require('@aws-cdk/aws-ec2');
import route53 = require('@aws-cdk/aws-route53');
import { Stack } from '@aws-cdk/core';
import targets = require('../lib');

test('use InterfaceVpcEndpoint as record target', () => {
  // GIVEN
  const stack = new Stack();
  const vpc = new ec2.Vpc(stack, 'VPC');

  const interfaceVpcEndpoint = new ec2.InterfaceVpcEndpoint(stack, 'InterfaceEndpoint', {
    vpc,
    service: {
      name: 'com.amazonaws.vpce.us-west-2.vpce-svc-0123456789',
      port: 80
    }
  });
  const zone = new route53.PrivateHostedZone(stack, 'PrivateZone', {
    vpc,
    zoneName: 'test.aws.cdk.com'
  });

  // WHEN
  new route53.ARecord(stack, "AliasEndpointRecord", {
    zone,
    recordName: 'foo',
    target: route53.RecordTarget.fromAlias(new targets.InterfaceVpcEndpointTarget(interfaceVpcEndpoint))
  });

  // THEN
  expect(stack).toHaveResource('AWS::Route53::RecordSet', {
    AliasTarget: {
      HostedZoneId: {
        "Fn::Select": [
          0,
          {
            "Fn::Split": [
              ":",
              {
                "Fn::Select": [
                  0,
                  {
                    "Fn::GetAtt": [
                      "InterfaceEndpoint12DE6E71",
                      "DnsEntries"
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      DNSName: {
        "Fn::Select": [
          1,
          {
            "Fn::Split": [
              ":",
              {
                "Fn::Select": [
                  0,
                  {
                    "Fn::GetAtt": [
                      "InterfaceEndpoint12DE6E71",
                      "DnsEntries"
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  });
});
